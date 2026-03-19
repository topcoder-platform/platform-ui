import {
    FC,
    useCallback,
    useEffect,
    useMemo,
} from 'react'
import {
    useController,
    useFormContext,
} from 'react-hook-form'
import type {
    UseFormReturn,
} from 'react-hook-form'

import {
    FormFieldWrapper,
    FormSelectField,
    FormSelectOption,
    PrizeInput,
} from '../../../../../lib/components/form'
import {
    DEFAULT_CHECKPOINT_PRIZE,
    DEFAULT_CHECKPOINT_PRIZE_COUNT,
    MAX_CHECKPOINT_PRIZE_COUNT,
    PRIZE_SET_TYPES,
} from '../../../../../lib/constants/challenge-editor.constants'
import {
    ChallengeEditorFormData,
    PrizeSet,
} from '../../../../../lib/models'
import { getPrizeType } from '../../../../../lib/utils'

import styles from './CheckpointPrizesField.module.scss'

type PrizeType = 'USD' | 'POINT'

interface CheckpointPrizesFieldProps {
    disabled?: boolean
    name: string
}

function createCheckpointPrizeSet(
    prizeType: PrizeType,
    amount: number,
    count: number,
): PrizeSet {
    const normalizedCount = Math.min(
        Math.max(count, 1),
        MAX_CHECKPOINT_PRIZE_COUNT,
    )

    return {
        prizes: Array.from({
            length: normalizedCount,
        }, () => ({
            type: prizeType,
            value: amount,
        })),
        type: PRIZE_SET_TYPES.CHECKPOINT,
    }
}

function upsertCheckpointPrizeSet(
    prizeSets: PrizeSet[],
    checkpointPrizeSet: PrizeSet,
): PrizeSet[] {
    const checkpointPrizeSetIndex = prizeSets.findIndex(prizeSet => prizeSet.type === PRIZE_SET_TYPES.CHECKPOINT)

    if (checkpointPrizeSetIndex < 0) {
        return [
            ...prizeSets,
            checkpointPrizeSet,
        ]
    }

    return prizeSets.map((prizeSet, index) => (index === checkpointPrizeSetIndex
        ? checkpointPrizeSet
        : prizeSet))
}

export const CheckpointPrizesField: FC<CheckpointPrizesFieldProps> = (
    props: CheckpointPrizesFieldProps,
) => {
    const formContext: UseFormReturn<ChallengeEditorFormData> = useFormContext<ChallengeEditorFormData>()
    const control = formContext.control
    const setValue = formContext.setValue
    const prizeSetsController = useController({
        control,
        name: props.name as never,
    })
    const field = prizeSetsController.field

    const prizeSets = useMemo<PrizeSet[]>(
        () => (Array.isArray(field.value) ? field.value : []),
        [field.value],
    )
    const currentPrizeType = getPrizeType(prizeSets)
    const checkpointPrizeSet = prizeSets.find(prizeSet => prizeSet.type === PRIZE_SET_TYPES.CHECKPOINT)
    const checkpointPrizeCount = checkpointPrizeSet?.prizes?.length || DEFAULT_CHECKPOINT_PRIZE_COUNT
    const checkpointPrizeAmount = Number(checkpointPrizeSet?.prizes?.[0]?.value) || DEFAULT_CHECKPOINT_PRIZE

    const countOptions = useMemo<FormSelectOption[]>(
        () => Array.from({
            length: MAX_CHECKPOINT_PRIZE_COUNT,
        }, (_, index) => ({
            label: String(index + 1),
            value: String(index + 1),
        })),
        [],
    )

    useEffect(() => {
        if (checkpointPrizeSet) {
            return
        }

        const nextPrizeSets = upsertCheckpointPrizeSet(
            prizeSets,
            createCheckpointPrizeSet(
                currentPrizeType,
                DEFAULT_CHECKPOINT_PRIZE,
                DEFAULT_CHECKPOINT_PRIZE_COUNT,
            ),
        )

        setValue(props.name as never, nextPrizeSets as never, {
            shouldDirty: false,
            shouldValidate: true,
        })
    }, [
        checkpointPrizeSet,
        currentPrizeType,
        prizeSets,
        props.name,
        setValue,
    ])

    const mapFromPrizeSetsToCount = useCallback(
        (
            value: unknown,
            options: FormSelectOption[],
        ): FormSelectOption | undefined => {
            const resolvedPrizeSets = Array.isArray(value)
                ? value as PrizeSet[]
                : []
            const count = resolvedPrizeSets
                .find(prizeSet => prizeSet.type === PRIZE_SET_TYPES.CHECKPOINT)
                ?.prizes?.length
                || DEFAULT_CHECKPOINT_PRIZE_COUNT

            return options.find(option => option.value === String(count))
        },
        [],
    )

    const mapCountToPrizeSets = useCallback(
        (selected: FormSelectOption | FormSelectOption[] | undefined): PrizeSet[] => {
            const resolvedValue = Array.isArray(selected)
                ? selected[0]?.value
                : selected?.value
            const parsedCount = Number.parseInt(resolvedValue || '', 10)
            const nextCount = Number.isFinite(parsedCount)
                ? parsedCount
                : DEFAULT_CHECKPOINT_PRIZE_COUNT

            return upsertCheckpointPrizeSet(
                prizeSets,
                createCheckpointPrizeSet(
                    currentPrizeType,
                    checkpointPrizeAmount,
                    nextCount,
                ),
            )
        },
        [
            checkpointPrizeAmount,
            currentPrizeType,
            prizeSets,
        ],
    )

    const handleAmountChange = useCallback(
        (nextAmount: number): void => {
            const nextPrizeSets = upsertCheckpointPrizeSet(
                prizeSets,
                createCheckpointPrizeSet(
                    currentPrizeType,
                    nextAmount,
                    checkpointPrizeCount,
                ),
            )

            field.onChange(nextPrizeSets)
        },
        [
            checkpointPrizeCount,
            currentPrizeType,
            field,
            prizeSets,
        ],
    )

    return (
        <FormFieldWrapper
            label='Checkpoint Prizes'
            name={props.name}
        >
            <div className={styles.row}>
                <div className={styles.amountField}>
                    <PrizeInput
                        disabled={props.disabled}
                        onChange={handleAmountChange}
                        prizeType={currentPrizeType}
                        value={checkpointPrizeAmount}
                    />
                </div>

                <span className={styles.text}>for each submission up to</span>

                <FormSelectField
                    className={styles.countField}
                    disabled={props.disabled}
                    fromFieldValue={mapFromPrizeSetsToCount}
                    label=' '
                    name={props.name}
                    options={countOptions}
                    toFieldValue={mapCountToPrizeSets}
                />

                <span className={styles.text}>submissions</span>
            </div>
        </FormFieldWrapper>
    )
}

export default CheckpointPrizesField
