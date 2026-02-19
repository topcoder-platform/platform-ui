import {
    FC,
    useMemo,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'
import type {
    UseFormReturn,
} from 'react-hook-form'

import {
    PRIZE_SET_TYPES,
    PRIZE_TYPES,
} from '../../../../../lib/constants/challenge-editor.constants'
import {
    ChallengeEditorFormData,
    Prize,
    PrizeSet,
} from '../../../../../lib/models'
import {
    formatCurrency,
    getPrizeType,
} from '../../../../../lib/utils'
import styles from '../ChallengeFeeField/ChallengeFeeField.module.scss'

interface ReviewCostFieldProps {
    name: string
}

export const ReviewCostField: FC<ReviewCostFieldProps> = (
    props: ReviewCostFieldProps,
) => {
    const formContext: UseFormReturn<ChallengeEditorFormData> = useFormContext<ChallengeEditorFormData>()
    const control = formContext.control
    const watchedPrizeSets = useWatch({
        control,
        name: props.name as never,
    }) as unknown

    const normalizedPrizeSets = useMemo<PrizeSet[]>(
        () => (Array.isArray(watchedPrizeSets) ? watchedPrizeSets : []),
        [watchedPrizeSets],
    )

    const reviewCostPrize = useMemo<Prize | undefined>(
        () => normalizedPrizeSets
            .find(prizeSet => prizeSet.type === PRIZE_SET_TYPES.REVIEWER)
            ?.prizes?.[0],
        [normalizedPrizeSets],
    )
    const reviewCostType = reviewCostPrize?.type === PRIZE_TYPES.POINT || reviewCostPrize?.type === PRIZE_TYPES.USD
        ? reviewCostPrize.type
        : getPrizeType(normalizedPrizeSets)
    const formattedValue = useMemo(
        () => formatCurrency(Number(reviewCostPrize?.value) || 0, reviewCostType),
        [
            reviewCostPrize?.value,
            reviewCostType,
        ],
    )

    return (
        <div className={styles.lineItem}>
            <span className={styles.label}>Review Cost:</span>
            <span className={styles.value}>{formattedValue}</span>
        </div>
    )
}

export default ReviewCostField
