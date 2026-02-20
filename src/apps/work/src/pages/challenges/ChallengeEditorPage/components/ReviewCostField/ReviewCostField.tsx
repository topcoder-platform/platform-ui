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
    ChallengeEditorFormData,
    PrizeSet,
    Reviewer,
} from '../../../../../lib/models'
import {
    calculateEstimatedReviewerCost,
    getFirstPlacePrizeValue,
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
    const watchedReviewers = useWatch({
        control,
        name: 'reviewers' as never,
    }) as unknown

    const normalizedPrizeSets = useMemo<PrizeSet[]>(
        () => (Array.isArray(watchedPrizeSets) ? watchedPrizeSets : []),
        [watchedPrizeSets],
    )
    const normalizedReviewers = useMemo<Reviewer[]>(
        () => (Array.isArray(watchedReviewers) ? watchedReviewers : []),
        [watchedReviewers],
    )

    const firstPlacePrizeValue = useMemo(
        () => getFirstPlacePrizeValue(normalizedPrizeSets),
        [normalizedPrizeSets],
    )
    const reviewCost = useMemo(
        () => calculateEstimatedReviewerCost(firstPlacePrizeValue, normalizedReviewers),
        [
            firstPlacePrizeValue,
            normalizedReviewers,
        ],
    )
    const formattedValue = useMemo(
        () => `$${reviewCost.toLocaleString(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
        })}`,
        [reviewCost],
    )

    return (
        <div className={styles.lineItem}>
            <span className={styles.label}>Review Cost:</span>
            <span className={styles.value}>{formattedValue}</span>
        </div>
    )
}

export default ReviewCostField
