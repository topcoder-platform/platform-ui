import {
    FC,
    useCallback,
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
    PrizeInput,
} from '../../../../../lib/components/form'
import { PRIZE_SET_TYPES } from '../../../../../lib/constants/challenge-editor.constants'
import {
    ChallengeEditorFormData,
    PrizeSet,
} from '../../../../../lib/models'
import { getPrizeType } from '../../../../../lib/utils'

type PrizeType = 'USD' | 'POINT'

interface ReviewCostFieldProps {
    disabled?: boolean
    name: string
}

function createSinglePrizeSet(
    setType: string,
    prizeType: PrizeType,
    value: number,
): PrizeSet {
    return {
        prizes: [
            {
                type: prizeType,
                value,
            },
        ],
        type: setType,
    }
}

function upsertSinglePrizeSet(
    prizeSets: PrizeSet[],
    setType: string,
    prizeType: PrizeType,
    value: number,
): PrizeSet[] {
    const setIndex = prizeSets.findIndex(prizeSet => prizeSet.type === setType)
    const nextPrizeSet = createSinglePrizeSet(
        setType,
        prizeType,
        value,
    )

    if (setIndex < 0) {
        return [
            ...prizeSets,
            nextPrizeSet,
        ]
    }

    return prizeSets.map((prizeSet, index) => (index === setIndex
        ? nextPrizeSet
        : prizeSet))
}

export const ReviewCostField: FC<ReviewCostFieldProps> = (
    props: ReviewCostFieldProps,
) => {
    const formContext: UseFormReturn<ChallengeEditorFormData> = useFormContext<ChallengeEditorFormData>()
    const control = formContext.control
    const prizeSetsController = useController({
        control,
        name: props.name as never,
    })
    const field = prizeSetsController.field

    const prizeSets = useMemo<PrizeSet[]>(
        () => (Array.isArray(field.value) ? field.value : []),
        [field.value],
    )
    const prizeType = getPrizeType(prizeSets)
    const reviewCostValue = Number(
        prizeSets.find(prizeSet => prizeSet.type === PRIZE_SET_TYPES.REVIEWER)
            ?.prizes?.[0]
            ?.value,
    ) || 0

    const handleValueChange = useCallback(
        (nextValue: number): void => {
            const nextPrizeSets = upsertSinglePrizeSet(
                prizeSets,
                PRIZE_SET_TYPES.REVIEWER,
                prizeType,
                nextValue,
            )

            field.onChange(nextPrizeSets)
        },
        [
            field,
            prizeSets,
            prizeType,
        ],
    )

    return (
        <FormFieldWrapper
            label='Review Cost'
            name={props.name}
        >
            <PrizeInput
                disabled={props.disabled}
                onChange={handleValueChange}
                prizeType={prizeType}
                value={reviewCostValue}
            />
        </FormFieldWrapper>
    )
}

export default ReviewCostField
