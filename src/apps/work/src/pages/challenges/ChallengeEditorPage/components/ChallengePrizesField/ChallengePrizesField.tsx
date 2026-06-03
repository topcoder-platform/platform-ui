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
import { PrizeInput } from '../../../../../lib/components/form'
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
    const normalizedTypeValues = [
        challengeTypeName,
        challengeTypeAbbreviation,
    ]
        .map(value => (value || '')
            .trim()
            .toLowerCase())
        .filter(Boolean)

    if (!normalizedTypeValues.length) {
        return false
    }

    return CHALLENGE_TYPES_WITH_MULTIPLE_PRIZES.some(challengeType => {
        const normalizedName = challengeType.name
            .trim()
            .toLowerCase()
        const normalizedAbbreviation = challengeType.abbreviation
            .trim()
            .toLowerCase()

        return normalizedTypeValues.includes(normalizedName)
            || normalizedTypeValues.includes(normalizedAbbreviation)
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
    const [activePrizeIndex, setActivePrizeIndex] = useState<number | undefined>()

    const supportsMultiplePrizes = useMemo(
        () => hasMultiplePrizesSupport(
            props.challengeTypeName,
            props.challengeTypeAbbreviation,
        ) || (Array.isArray(placementPrizes) && placementPrizes.length > 1),
        [
            placementPrizes,
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

    const nonIncreasingOrderError = useMemo(() => {
        if (!Array.isArray(placementPrizes) || placementPrizes.length < 2) {
            return undefined
        }

        for (let index = 1; index < placementPrizes.length; index += 1) {
            const previousPrize = Number(placementPrizes[index - 1]?.value) || 0
            const currentPrize = Number(placementPrizes[index]?.value) || 0

            if (
                previousPrize > 0
                && currentPrize > 0
                && currentPrize > previousPrize
            ) {
                return 'Each subsequent prize must be less than or equal to the one above it.'
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
            setActivePrizeIndex(index)
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

    const prizeFocusHandlers = useMemo<VoidHandler[]>(
        () => fields.map((_, index) => (): void => {
            setActivePrizeIndex(index)
        }),
        [fields],
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
    const showPrizeRowLabels = fields.length > 0
    const errorMessage = fieldError || nonIncreasingOrderError
    const prizeTypeFieldName = `${props.name}-type`
    const fieldLabelId = `${props.name}-label`
    const usdOptionId = `${prizeTypeFieldName}-usd`
    const pointsOptionId = `${prizeTypeFieldName}-points`

    return (
        <>
            <div className={styles.field}>
                <div
                    className={classNames(
                        styles.fieldHeader,
                        showPrizeRowLabels ? styles.fieldHeaderWithPrizeLabels : undefined,
                    )}
                >
                    <div className={styles.fieldLabel} id={fieldLabelId}>
                        Challenge Prizes
                        <span className={styles.required}>*</span>
                    </div>

                    <div
                        aria-labelledby={fieldLabelId}
                        className={styles.typeToggle}
                        role='radiogroup'
                    >
                        <label
                            className={classNames(
                                styles.typeOption,
                                props.disabled ? styles.typeOptionDisabled : undefined,
                            )}
                            htmlFor={usdOptionId}
                        >
                            <input
                                checked={currentPrizeType === PRIZE_TYPES.USD}
                                className={styles.typeToggleInput}
                                disabled={props.disabled}
                                id={usdOptionId}
                                name={prizeTypeFieldName}
                                onChange={handleSelectUsd}
                                type='radio'
                            />
                            <span>USD</span>
                        </label>
                        <label
                            className={classNames(
                                styles.typeOption,
                                props.disabled ? styles.typeOptionDisabled : undefined,
                            )}
                            htmlFor={pointsOptionId}
                        >
                            <input
                                checked={currentPrizeType === PRIZE_TYPES.POINT}
                                className={styles.typeToggleInput}
                                disabled={props.disabled}
                                id={pointsOptionId}
                                name={prizeTypeFieldName}
                                onChange={handleSelectPoints}
                                type='radio'
                            />
                            <span>Points</span>
                        </label>
                    </div>
                </div>

                <div className={styles.prizeRows}>
                    {fields.map((prizeField, index) => {
                        const prizeValue = Number(placementPrizes?.[index]?.value) || 0
                        const prizeValueError = get(
                            formState.errors,
                            `${placementPrizesName}.${index}.value`,
                        ) as { message?: string } | undefined
                        const prizeValueErrorMessage = typeof prizeValueError?.message === 'string'
                            ? prizeValueError.message
                            : undefined
                        const hasValueError = !!prizeValueError
                        const isRemovablePrize = showPrizeRowLabels && index > 0

                        return (
                            <div
                                className={classNames(
                                    styles.prizeRow,
                                    styles.multiPrizeRow,
                                    isRemovablePrize ? styles.prizeRowWithRemove : undefined,
                                    prizeValueErrorMessage ? styles.prizeRowWithError : undefined,
                                )}
                                key={prizeField.id}
                            >
                                <span className={styles.prizeLabel}>
                                    {`Prize ${index + 1}`}
                                </span>

                                <div className={styles.prizeInputField}>
                                    <PrizeInput
                                        autoFocus={activePrizeIndex === index}
                                        disabled={props.disabled}
                                        error={hasValueError || !!nonIncreasingOrderError}
                                        onChange={prizeValueChangeHandlers[index]}
                                        onFocus={prizeFocusHandlers[index]}
                                        prizeType={currentPrizeType}
                                        value={prizeValue}
                                    />
                                    {prizeValueErrorMessage
                                        ? (
                                            <div className={styles.prizeValueError}>
                                                {prizeValueErrorMessage}
                                            </div>
                                        )
                                        : undefined}
                                </div>

                                {isRemovablePrize
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
                                    : undefined}
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

                {errorMessage
                    ? <div className={styles.fieldError}>{errorMessage}</div>
                    : undefined}
            </div>

            {showPointsConfirmation
                ? (
                    <ConfirmationModal
                        confirmText='Confirm'
                        message={
                            'You have selected POINTS as a payment for this challenge.  '
                            + 'Please be aware that POINTS are only approved for Wipro internal challenges '
                            + 'and fun challenges.  POINTS are not acceptable for customer work.'
                        }
                        onCancel={handleCancelPointType}
                        onConfirm={handleConfirmPointType}
                        title='Confirm Points Prize'
                    />
                )
                : undefined}
        </>
    )
}

export default ChallengePrizesField
