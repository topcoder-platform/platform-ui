import {
    FC,
    useMemo,
} from 'react'
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

import styles from './ChallengeTotalField.module.scss'

export const ChallengeTotalField: FC = () => {
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

    const prizeSets = useMemo<PrizeSet[]>(
        () => (Array.isArray(watchedPrizeSets) ? watchedPrizeSets : []),
        [watchedPrizeSets],
    )
    const reviewers = useMemo<ChallengeReviewer[]>(
        () => (Array.isArray(watchedReviewers) ? watchedReviewers : []),
        [watchedReviewers],
    )
    const challengeTotal = useMemo(
        () => calculateChallengeTotal(prizeSets, reviewers),
        [
            prizeSets,
            reviewers,
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
    const total = useMemo(() => {
        const fallbackChallengeFee = Number(watchedChallengeFee)
        const challengeFee = calculatedChallengeFee ?? (
            Number.isFinite(fallbackChallengeFee)
                ? fallbackChallengeFee
                : 0
        )

        return challengeTotal + challengeFee
    }, [
        calculatedChallengeFee,
        challengeTotal,
        watchedChallengeFee,
    ])
    const formattedValue = useMemo(
        () => formatUsdCurrency(total),
        [total],
    )

    return (
        <div className={styles.lineItem}>
            <span className={styles.label}>Estimated challenge total:</span>
            <span className={styles.value}>{formattedValue}</span>
        </div>
    )
}

export default ChallengeTotalField
