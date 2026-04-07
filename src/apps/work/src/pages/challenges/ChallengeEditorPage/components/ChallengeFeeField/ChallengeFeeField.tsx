import { FC, useMemo } from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'

import {
    ChallengeEditorFormData,
    ChallengeReviewer,
    PrizeSet,
} from '../../../../../lib/models'
import {
    calculateChallengeFee,
    calculateChallengeTotal,
    formatUsdCurrency,
} from '../../../../../lib/utils/prize.utils'

import styles from './ChallengeFeeField.module.scss'

export const ChallengeFeeField: FC = () => {
    const formContext: UseFormReturn<ChallengeEditorFormData> = useFormContext<ChallengeEditorFormData>()
    const control = formContext.control
    const watchedBilling = useWatch({
        control,
        name: 'billing' as never,
    }) as unknown
    const watchedChallengeFee = useWatch({
        control,
        name: 'challengeFee' as never,
    }) as unknown
    const watchedPrizeSets = useWatch({
        control,
        name: 'prizeSets' as never,
    }) as unknown
    const watchedReviewers = useWatch({
        control,
        name: 'reviewers' as never,
    }) as unknown

    const normalizedPrizeSets = useMemo<PrizeSet[]>(
        () => (Array.isArray(watchedPrizeSets) ? watchedPrizeSets : []),
        [watchedPrizeSets],
    )
    const normalizedReviewers = useMemo<ChallengeReviewer[]>(
        () => (Array.isArray(watchedReviewers) ? watchedReviewers : []),
        [watchedReviewers],
    )
    const challengeTotal = useMemo(
        () => calculateChallengeTotal(normalizedPrizeSets, normalizedReviewers),
        [
            normalizedPrizeSets,
            normalizedReviewers,
        ],
    )
    const calculatedChallengeFee = useMemo(
        (): number | undefined => calculateChallengeFee(
            challengeTotal,
            (watchedBilling as ChallengeEditorFormData['billing'] | undefined)?.markup,
        ),
        [
            challengeTotal,
            watchedBilling,
        ],
    )
    const formattedValue = useMemo(
        () => formatUsdCurrency(calculatedChallengeFee ?? watchedChallengeFee),
        [
            calculatedChallengeFee,
            watchedChallengeFee,
        ],
    )

    return (
        <div className={styles.lineItem}>
            <span className={styles.label}>Challenge fee:</span>
            <span className={styles.value}>{formattedValue}</span>
        </div>
    )
}

export default ChallengeFeeField
