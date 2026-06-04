import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
import classNames from 'classnames'

import {
    getRatingColor,
    useMemberStats,
    UserProfile,
    UserStats,
    UserStatsDistributionResponse,
    useStatsDistribution,
} from '~/libs/core'
import { Tooltip } from '~/libs/ui'

import { numberToFixed } from '../../../lib'

import {
    calculateTopPercentileFromDistribution,
    getRatingAudienceLabel,
    getRatingDistributionQuery,
} from './MemberRatingCard.utils'
import { MemberRatingInfoModal } from './MemberRatingInfoModal'
import styles from './MemberRatingCard.module.scss'

interface MemberRatingCardProps {
    profile: UserProfile
}

/**
 * Formats percentile values for the compact rating card.
 *
 * @param {number} percentile - The percentile value calculated from the rating distribution.
 * @returns {string} A display-ready percentage without unnecessary decimal places.
 */
const formatPercentile = (percentile: number): string => (
    numberToFixed(percentile, 0)
)

const MemberRatingCard: FC<MemberRatingCardProps> = (props: MemberRatingCardProps) => {
    const memberStats: UserStats | undefined = useMemberStats(props.profile.handle)

    const [isInfoModalOpen, setIsInfoModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    const ratingDistributionQuery = useMemo(() => getRatingDistributionQuery(memberStats), [memberStats])

    const ratingDistribution: UserStatsDistributionResponse | undefined = useStatsDistribution(ratingDistributionQuery)

    const rating: number | undefined = memberStats?.maxRating?.rating
    const maxPercentile: number | undefined = useMemo(() => (
        calculateTopPercentileFromDistribution(ratingDistribution?.distribution, rating)
    ), [rating, ratingDistribution])
    const audienceLabel: string = getRatingAudienceLabel(memberStats)
    const percentileLabel: string | undefined = maxPercentile
        ? `Top ${formatPercentile(maxPercentile)}%`
        : undefined

    function handleInfoModalClose(): void {
        setIsInfoModalOpen(false)
    }

    function handleInfoModalOpen(): void {
        setIsInfoModalOpen(true)
    }

    return memberStats?.maxRating?.rating ? (
        <div className={styles.container}>
            <div className={styles.innerWrap}>
                <button type='button' className={styles.valueWrap} onClick={handleInfoModalOpen}>
                    <p className={styles.value} style={{ color: getRatingColor(rating) }}>
                        {rating}
                    </p>
                    <p className={styles.name}>Rating</p>
                </button>
                {
                    percentileLabel ? (
                        <Tooltip
                            className={styles.ratingTooltip}
                            content={(
                                <span className={styles.tooltipContent}>
                                    {percentileLabel}
                                    {' '}
                                    of
                                    <br />
                                    2M
                                    {' '}
                                    {audienceLabel.toLowerCase()}
                                </span>
                            )}
                            place='top'
                        >
                            <button
                                type='button'
                                className={classNames(styles.valueWrap, styles.percentileWrap)}
                                onClick={handleInfoModalOpen}
                            >
                                <p
                                    className={classNames(styles.value, styles.percentileValue)}
                                    style={{ color: getRatingColor(rating) }}
                                >
                                    {percentileLabel}
                                </p>
                                <p className={styles.name}>{audienceLabel}</p>
                            </button>
                        </Tooltip>
                    ) : undefined
                }
                <button type='button' className={styles.link} onClick={handleInfoModalOpen}>What is this?</button>
            </div>

            {
                isInfoModalOpen && (
                    <MemberRatingInfoModal
                        onClose={handleInfoModalClose}
                        percentile={maxPercentile}
                        profile={props.profile}
                        rating={rating}
                        audienceLabel={audienceLabel}
                        ratingDistribution={ratingDistribution}
                    />
                )
            }
        </div>
    ) : <></>
}

export default MemberRatingCard
