import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useController,
    useFieldArray,
    useFormContext,
    useWatch,
} from 'react-hook-form'
import type {
    UseFormReturn,
} from 'react-hook-form'
import classNames from 'classnames'
import get from 'lodash/get'

import { TrashIcon } from '@heroicons/react/outline'
import { Button } from '~/libs/ui'

import { ConfirmationModal } from '../../../../../lib/components'
import {
    FormFieldWrapper,
    PrizeInput,
} from '../../../../../lib/components/form'
import {
    CHALLENGE_TYPES_WITH_MULTIPLE_PRIZES,
    PRIZE_SET_TYPES,
    PRIZE_TYPES,
} from '../../../../../lib/constants/challenge-editor.constants'
import {
    ChallengeEditorFormData,
    Prize,
    PrizeSet,
} from '../../../../../lib/models'
import {
    applyPrizeTypeToPrizeSets,
    getPrizeType,
} from '../../../../../lib/utils'

import styles from './ChallengePrizesField.module.scss'

type PrizeType = 'USD' | 'POINT'
type NumberChangeHandler = (value: number) => void
type VoidHandler = () => void

interface ChallengePrizesFieldProps {
    challengeTypeAbbreviation?: string
    challengeTypeName?: string
    disabled?: boolean
    name: string
}

function createPlacementPrizeSet(prizeType: PrizeType): PrizeSet {
    return {
        prizes: [
            {
                type: prizeType,
                value: 0,
            },
        ],
        type: PRIZE_SET_TYPES.PLACEMENT,
    }
}

function hasMultiplePrizesSupport(
    challengeTypeName?: string,
    challengeTypeAbbreviation?: string,
): boolean {
    const normalizedChallengeTypeName = (challengeTypeName || '')
        .trim()
        .toLowerCase()
    const normalizedChallengeTypeAbbreviation = (challengeTypeAbbreviation || '')
        .trim()
        .toLowerCase()

    if (!normalizedChallengeTypeName && !normalizedChallengeTypeAbbreviation) {
        return false
    }

    return CHALLENGE_TYPES_WITH_MULTIPLE_PRIZES.some(challengeType => {
        const hasMatchingName = normalizedChallengeTypeName
            ? challengeType.name.toLowerCase() === normalizedChallengeTypeName
            : false
        const hasMatchingAbbreviation = normalizedChallengeTypeAbbreviation
            ? challengeType.abbreviation.toLowerCase() === normalizedChallengeTypeAbbreviation
            : false

        return hasMatchingName || hasMatchingAbbreviation
    })
}

function applyPrizeTypeToPrizeSetsPreservingCopilotFees(
    prizeSets: PrizeSet[],
    prizeType: PrizeType,
): PrizeSet[] {
    return applyPrizeTypeToPrizeSets(prizeSets, prizeType)
        .map(prizeSet => {
            if (prizeSet.type !== PRIZE_SET_TYPES.COPILOT) {
                return prizeSet
            }

            return {
                ...prizeSet,
                prizes: (prizeSet.prizes || []).map(prize => ({
                    ...prize,
                    type: PRIZE_TYPES.USD,
                })),
            }
        })
}

export const ChallengePrizesField: FC<ChallengePrizesFieldProps> = (
    props: ChallengePrizesFieldProps,
) => {
    const formContext: UseFormReturn<ChallengeEditorFormData> = useFormContext<ChallengeEditorFormData>()
    const control = formContext.control
    const formState = formContext.formState
    const setValue = formContext.setValue

    const prizeSetsController = useController({
        control,
        name: props.name as never,
    })
    const field = prizeSetsController.field
    const fieldState = prizeSetsController.fieldState

    const prizeSets = useMemo<PrizeSet[]>(
        () => (Array.isArray(field.value) ? field.value : []),
        [field.value],
    )
    const currentPrizeType = getPrizeType(prizeSets)
    const placementSetIndex = prizeSets.findIndex(prizeSet => prizeSet.type === PRIZE_SET_TYPES.PLACEMENT)
    const placementPrizesName = `${props.name}.${placementSetIndex >= 0 ? placementSetIndex : 0}.prizes`

    const placementPrizesFieldArray = useFieldArray({
        control,
        name: placementPrizesName as never,
    })
    const append = placementPrizesFieldArray.append
    const fields = placementPrizesFieldArray.fields
    const remove = placementPrizesFieldArray.remove

    const placementPrizes = useWatch({
        control,
        name: placementPrizesName as never,
    }) as unknown as Prize[] | undefined

    const [pendingPrizeType, setPendingPrizeType] = useState<PrizeType | undefined>()
    const [showPointsConfirmation, setShowPointsConfirmation] = useState<boolean>(false)

    const supportsMultiplePrizes = useMemo(
        () => hasMultiplePrizesSupport(
            props.challengeTypeName,
            props.challengeTypeAbbreviation,
        ),
        [
            props.challengeTypeAbbreviation,
            props.challengeTypeName,
        ],
    )

    useEffect(() => {
        if (placementSetIndex >= 0) {
            return
        }

        const nextPrizeSets = [
            ...prizeSets,
            createPlacementPrizeSet(currentPrizeType),
        ]

        setValue(props.name as never, nextPrizeSets as never, {
            shouldDirty: false,
            shouldValidate: true,
        })
    }, [
        currentPrizeType,
        placementSetIndex,
        prizeSets,
        props.name,
        setValue,
    ])

    useEffect(() => {
        if (placementSetIndex < 0) {
            return
        }

        if (Array.isArray(placementPrizes) && placementPrizes.length > 0) {
            return
        }

        append({
            type: currentPrizeType,
            value: 0,
        })
    }, [
        append,
        currentPrizeType,
        placementPrizes,
        placementSetIndex,
    ])

    const descendingError = useMemo(() => {
        if (!Array.isArray(placementPrizes) || placementPrizes.length < 2) {
            return undefined
        }

        for (let index = 1; index < placementPrizes.length; index += 1) {
            const previousPrize = Number(placementPrizes[index - 1]?.value) || 0
            const currentPrize = Number(placementPrizes[index]?.value) || 0

            if (currentPrize > previousPrize) {
                return 'Prize values must be in descending order.'
            }
        }

        return undefined
    }, [placementPrizes])

    const updateAllPrizeTypes = useCallback(
        (nextPrizeType: PrizeType): void => {
            const nextPrizeSets = applyPrizeTypeToPrizeSetsPreservingCopilotFees(
                prizeSets,
                nextPrizeType,
            )
            field.onChange(nextPrizeSets)
        },
        [field, prizeSets],
    )

    const handlePrizeTypeChange = useCallback(
        (nextPrizeType: PrizeType): void => {
            if (nextPrizeType === currentPrizeType) {
                return
            }

            if (nextPrizeType === PRIZE_TYPES.POINT) {
                setPendingPrizeType(nextPrizeType)
                setShowPointsConfirmation(true)
                return
            }

            updateAllPrizeTypes(nextPrizeType)
        },
        [
            currentPrizeType,
            updateAllPrizeTypes,
        ],
    )

    const handleSelectUsd = useCallback(
        (): void => handlePrizeTypeChange(PRIZE_TYPES.USD),
        [handlePrizeTypeChange],
    )

    const handleSelectPoints = useCallback(
        (): void => handlePrizeTypeChange(PRIZE_TYPES.POINT),
        [handlePrizeTypeChange],
    )

    const handleConfirmPointType = useCallback(() => {
        updateAllPrizeTypes(pendingPrizeType || PRIZE_TYPES.POINT)
        setPendingPrizeType(undefined)
        setShowPointsConfirmation(false)
    }, [
        pendingPrizeType,
        updateAllPrizeTypes,
    ])

    const handleCancelPointType = useCallback(() => {
        setPendingPrizeType(undefined)
        setShowPointsConfirmation(false)
    }, [])

    const handlePrizeValueChange = useCallback(
        (index: number, value: number): void => {
            setValue(`${placementPrizesName}.${index}.value` as never, value as never, {
                shouldDirty: true,
                shouldValidate: true,
            })
        },
        [
            placementPrizesName,
            setValue,
        ],
    )

    const handleAddPrize = useCallback(() => {
        append({
            type: currentPrizeType,
            value: 0,
        })
    }, [
        append,
        currentPrizeType,
    ])

    const prizeValueChangeHandlers = useMemo<NumberChangeHandler[]>(
        () => fields.map((_, index) => (value: number): void => {
            handlePrizeValueChange(index, value)
        }),
        [
            fields,
            handlePrizeValueChange,
        ],
    )

    const removeHandlers = useMemo<VoidHandler[]>(
        () => fields.map((_, index) => (): void => {
            remove(index)
        }),
        [
            fields,
            remove,
        ],
    )

    const fieldError = typeof fieldState.error?.message === 'string'
        ? fieldState.error.message
        : undefined

    return (
        <>
            <FormFieldWrapper
                error={fieldError || descendingError}
                label='Challenge Prizes'
                name={props.name}
                required
            >
                <div className={styles.container}>
                    <div className={styles.typeToggle}>
                        <button
                            className={classNames(
                                styles.toggleButton,
                                currentPrizeType === PRIZE_TYPES.USD ? styles.active : undefined,
                            )}
                            disabled={props.disabled}
                            onClick={handleSelectUsd}
                            type='button'
                        >
                            USD
                        </button>
                        <button
                            className={classNames(
                                styles.toggleButton,
                                currentPrizeType === PRIZE_TYPES.POINT ? styles.active : undefined,
                            )}
                            disabled={props.disabled}
                            onClick={handleSelectPoints}
                            type='button'
                        >
                            Points
                        </button>
                    </div>

                    <div className={styles.prizeRows}>
                        {fields.map((prizeField, index) => {
                            const prizeValue = Number(placementPrizes?.[index]?.value) || 0
                            const hasValueError = !!get(
                                formState.errors,
                                `${placementPrizesName}.${index}.value`,
                            )

                            return (
                                <div className={styles.prizeRow} key={prizeField.id}>
                                    <span className={styles.prizeLabel}>
                                        {supportsMultiplePrizes
                                            ? `Prize ${index + 1}`
                                            : 'Prize'}
                                    </span>

                                    <PrizeInput
                                        disabled={props.disabled}
                                        error={hasValueError || !!descendingError}
                                        onChange={prizeValueChangeHandlers[index]}
                                        prizeType={currentPrizeType}
                                        value={prizeValue}
                                    />

                                    {index > 0
                                        ? (
                                            <button
                                                className={styles.trashButton}
                                                disabled={props.disabled}
                                                onClick={removeHandlers[index]}
                                                type='button'
                                            >
                                                <TrashIcon className={styles.trashIcon} />
                                            </button>
                                        )
                                        : <div className={styles.trashPlaceholder} />}
                                </div>
                            )
                        })}
                    </div>

                    {supportsMultiplePrizes
                        ? (
                            <Button
                                className={styles.addButton}
                                disabled={props.disabled}
                                label='+ Add New Prize'
                                onClick={handleAddPrize}
                                secondary
                                size='lg'
                            />
                        )
                        : undefined}
                </div>
            </FormFieldWrapper>

            {showPointsConfirmation
                ? (
                    <ConfirmationModal
                        confirmText='Switch to Points'
                        message='Switching to points will apply to all configured prize sets. Continue?'
                        onCancel={handleCancelPointType}
                        onConfirm={handleConfirmPointType}
                        title='Switch Prize Type'
                    />
                )
                : undefined}
        </>
    )
}

export default ChallengePrizesField
