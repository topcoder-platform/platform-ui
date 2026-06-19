import { CSSProperties, FC, useMemo } from 'react'
import classNames from 'classnames'

import { getRatingColor, UserProfile, UserStatsDistributionResponse } from '~/libs/core'
import { BaseModal } from '~/libs/ui'

import { formatTopPercentile } from '../MemberRatingCard.utils'

import styles from './MemberRatingInfoModal.module.scss'

interface MemberRatingInfoModalProps {
    audienceLabel: string
    onClose: () => void
    percentile?: number
    profile: UserProfile
    rating?: number
    ratingDistribution?: UserStatsDistributionResponse
}

interface RatingDistributionRange {
    end: number
    key: string
    start: number
    value: number
}

interface RatingTier {
    color: string
    end?: number
    highlightColor: string
    id: string
    label: string
    rangeLabel: string
    start: number
    tierLabel: string
}

const ratingTiers: RatingTier[] = [{
    color: '#555555',
    end: 899,
    highlightColor: '#F4F4F4',
    id: 'beginner',
    label: 'Beginner',
    rangeLabel: '0-899',
    start: 0,
    tierLabel: 'Beginner Tier',
}, {
    color: '#2D7E2D',
    end: 1199,
    highlightColor: '#E8F5E8',
    id: 'intermediate',
    label: 'Intermediate',
    rangeLabel: '900-1199',
    start: 900,
    tierLabel: 'Intermediate Tier',
}, {
    color: '#616BD5',
    end: 1499,
    highlightColor: '#EEF0FF',
    id: 'skilled',
    label: 'Skilled',
    rangeLabel: '1200-1499',
    start: 1200,
    tierLabel: 'Skilled Tier',
}, {
    color: '#F2C900',
    end: 2199,
    highlightColor: '#FFFBD0',
    id: 'advanced',
    label: 'Advanced',
    rangeLabel: '1500-2199',
    start: 1500,
    tierLabel: 'Advanced Tier',
}, {
    color: '#EF3A3A',
    highlightColor: '#FFF0F0',
    id: 'elite',
    label: 'Elite',
    rangeLabel: '2200+',
    start: 2200,
    tierLabel: 'Elite Tier',
}]

const chartAxisLabels: Array<{ label: string, value: number }> = [{
    label: '0',
    value: 0,
}, {
    label: '900',
    value: 900,
}, {
    label: '1200',
    value: 1200,
}, {
    label: '1500',
    value: 1500,
}, {
    label: '2200+',
    value: 2200,
}]

// The inline avatar and score need room to the right of the marker, so stack
// before the marker reaches the final segment of the chart.
const stackedMarkerPositionThreshold = 80

/**
 * Formats percentile values for the rating comparison modal.
 *
 * Used by MemberRatingInfoModal to keep the top percentile text consistent with
 * the compact rating card, including showing positive sub-1% values as 1%.
 *
 * @param {number | undefined} percentile - The percentile value calculated from the rating distribution.
 * @returns {string} A display-ready percentage or `--` when the percentile is unavailable.
 */
const formatPercentile = (percentile?: number): string => (
    percentile === undefined || percentile === 0
        ? '--'
        : formatTopPercentile(percentile)
)

/**
 * Returns the Topcoder rating tier metadata for a rating.
 *
 * Used by MemberRatingInfoModal to color the summary, histogram, and legend.
 *
 * @param {number | undefined} rating - The member rating value or a rating range start.
 * @returns {RatingTier} The tier metadata that matches the rating.
 */
const getRatingTier = (rating?: number): RatingTier => (
    ratingTiers.find((tier: RatingTier) => (
        rating !== undefined
        && rating >= tier.start
        && (tier.end === undefined || rating <= tier.end)
    )) ?? ratingTiers[0]
)

/**
 * Returns the Topcoder rating tier name for the provided rating.
 *
 * Used by MemberRatingInfoModal in the overall rating summary.
 *
 * @param {number | undefined} rating - The member rating value.
 * @returns {string} The tier label displayed in the rating info modal.
 */
const getRatingTierName = (rating?: number): string => (
    rating === undefined ? 'Unrated' : getRatingTier(rating).tierLabel
)

/**
 * Parses the API distribution payload into ordered rating ranges.
 *
 * Used by MemberRatingInfoModal to render custom histogram bars from the same
 * data used by the detailed member stats chart.
 *
 * @param {UserStatsDistributionResponse['distribution'] | undefined} distribution - Raw API distribution data.
 * @returns {RatingDistributionRange[]} Sorted histogram ranges with numeric starts, ends, and counts.
 */
const getDistributionRanges = (
    distribution?: UserStatsDistributionResponse['distribution'],
): RatingDistributionRange[] => (
    Object.entries(distribution ?? {})
        .map(([key, value]: [string, number]) => {
            const match: RegExpMatchArray | null = key.match(/ratingRange(\d+)To(\d+)/)

            return {
                end: match ? parseInt(match[2], 10) : Number.NaN,
                key,
                start: match ? parseInt(match[1], 10) : Number.NaN,
                value,
            }
        })
        .filter((range: RatingDistributionRange) => (
            Number.isFinite(range.start)
            && Number.isFinite(range.end)
            && Number.isFinite(range.value)
        ))
        .sort((rangeA: RatingDistributionRange, rangeB: RatingDistributionRange) => rangeA.start - rangeB.start)
)

/**
 * Returns the chart end rating used for marker and axis positioning.
 *
 * Used by MemberRatingInfoModal to align labels with the rendered distribution range.
 *
 * @param {RatingDistributionRange[]} ranges - Parsed rating distribution ranges.
 * @returns {number} The maximum rating represented by the chart.
 */
const getChartEndRating = (ranges: RatingDistributionRange[]): number => {
    if (ranges.length === 0) {
        return 3999
    }

    return ranges[ranges.length - 1].end
}

/**
 * Calculates a horizontal chart position for a rating value.
 *
 * Used by MemberRatingInfoModal for the member marker and static x-axis labels.
 *
 * @param {number} rating - The rating value to position.
 * @param {RatingDistributionRange[]} ranges - Parsed rating distribution ranges.
 * @returns {number} A clamped percentage from 0 to 100.
 */
const getChartPosition = (rating: number, ranges: RatingDistributionRange[]): number => {
    const chartStart = ranges[0]?.start ?? 0
    const chartEnd = getChartEndRating(ranges)
    const chartSpan = chartEnd - chartStart

    if (chartSpan <= 0) {
        return 0
    }

    const clampedRating = Math.max(chartStart, Math.min(rating, chartEnd))

    return ((clampedRating - chartStart) / chartSpan) * 100
}

/**
 * Calculates a bar height for a histogram count.
 *
 * Used by MemberRatingInfoModal to preserve visible bars for low non-zero ranges.
 *
 * @param {number} value - Number of members in the rating range.
 * @param {number} maxValue - Highest count in the distribution.
 * @returns {number} A percentage height for CSS rendering.
 */
const getBarHeight = (value: number, maxValue: number): number => {
    if (value <= 0 || maxValue <= 0) {
        return 0
    }

    return Math.max(4, Math.round((value / maxValue) * 100))
}

/**
 * Returns the display name used in the modal title and section copy.
 *
 * Used by MemberRatingInfoModal to prefer first name, then handle, then a generic label.
 *
 * @param {UserProfile} profile - The profile currently being viewed.
 * @returns {string} The safest member display label for comparison copy.
 */
const getMemberDisplayName = (profile: UserProfile): string => (
    profile.firstName || profile.handle || 'This member'
)

/**
 * Returns a fallback avatar initial for profiles without a photo.
 *
 * Used by MemberRatingInfoModal to keep the marker badge visible when no photo URL exists.
 *
 * @param {UserProfile} profile - The profile currently being viewed.
 * @returns {string} A one-character fallback initial.
 */
const getProfileInitial = (profile: UserProfile): string => (
    (profile.firstName || profile.handle || '?')
        .charAt(0)
        .toUpperCase()
)

const MemberRatingInfoModal: FC<MemberRatingInfoModalProps> = (props: MemberRatingInfoModalProps) => {
    const displayName: string = getMemberDisplayName(props.profile)
    const titleDisplayName: string = displayName
        .toUpperCase()
    const selectedRatingTier: RatingTier = getRatingTier(props.rating)
    const distributionRanges: RatingDistributionRange[] = useMemo(() => (
        getDistributionRanges(props.ratingDistribution?.distribution)
    ), [props.ratingDistribution])
    const maxDistributionValue: number = Math.max(
        1,
        ...distributionRanges.map((range: RatingDistributionRange) => range.value),
    )
    const markerPosition: number = props.rating !== undefined
        ? getChartPosition(props.rating, distributionRanges)
        : 0
    const shouldStackMarkerRating: boolean = markerPosition >= stackedMarkerPositionThreshold
    const percentileLabel: string = formatPercentile(props.percentile)

    return (
        <BaseModal
            bodyClassName={styles.body}
            classNames={{ modal: styles.modal }}
            onClose={props.onClose}
            open
            spacer={false}
            title={(
                <h3 className={styles.title}>
                    HOW
                    {' '}
                    {titleDisplayName}
                    {' '}
                    COMPARES TO 2M+ MEMBERS
                </h3>
            )}
            size='lg'
        >
            <div className={styles.content}>
                <hr className={styles.divider} />

                <p className={styles.description}>
                    Ratings come from head-to-head competitions and measure demonstrated skill across all
                    challenge types.
                </p>

                <div className={styles.summaryPanel}>
                    <div className={styles.summaryMetric}>
                        <span className={styles.summaryLabel}>Overall Rating</span>
                        <span className={styles.ratingValue} style={{ color: getRatingColor(props.rating) }}>
                            {props.rating ?? '--'}
                        </span>
                        <span className={styles.summaryMeta}>{getRatingTierName(props.rating)}</span>
                    </div>

                    <div
                        className={classNames(styles.summaryMetric, styles.positionMetric)}
                        data-testid='rating-position-summary'
                    >
                        <div className={styles.positionDetails}>
                            <span className={styles.summaryLabel}>Position</span>
                            <span className={styles.positionValue}>
                                TOP
                                {' '}
                                {percentileLabel}
                                {percentileLabel === '--' ? '' : '%'}
                            </span>
                            <span className={styles.summaryMeta}>
                                of
                                {' '}
                                {props.audienceLabel.toLowerCase()}
                            </span>
                        </div>
                    </div>
                </div>

                <h4 className={styles.sectionTitle}>
                    Where
                    {' '}
                    {displayName}
                    {' '}
                    ranks in the distribution
                </h4>

                <div className={styles.chart}>
                    {distributionRanges.length > 0 ? (
                        <div className={styles.chartScale}>
                            <div className={styles.bars}>
                                {distributionRanges.map((range: RatingDistributionRange) => (
                                    <span
                                        key={range.key}
                                        className={styles.bar}
                                        style={{
                                            backgroundColor: getRatingTier(range.start).color,
                                            height: `${getBarHeight(range.value, maxDistributionValue)}%`,
                                        }}
                                        title={`${range.start}-${range.end}: ${range.value}`}
                                    />
                                ))}
                            </div>

                            {props.rating !== undefined && (
                                <div
                                    className={classNames(
                                        styles.memberMarker,
                                        shouldStackMarkerRating && styles.memberMarkerStacked,
                                    )}
                                    data-testid='rating-member-marker'
                                    style={{ left: `${markerPosition}%` }}
                                >
                                    <div className={styles.markerBadge}>
                                        <span className={styles.markerAvatar}>
                                            {props.profile.photoURL ? (
                                                <img src={props.profile.photoURL} alt={`${displayName} avatar`} />
                                            ) : (
                                                <span className={styles.markerInitial}>
                                                    {getProfileInitial(props.profile)}
                                                </span>
                                            )}
                                        </span>
                                        <span
                                            className={styles.markerRating}
                                            style={{ color: getRatingColor(props.rating) }}
                                        >
                                            {props.rating}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className={styles.axisLabels}>
                                {chartAxisLabels.map((axisLabel: { label: string, value: number }) => (
                                    <span
                                        key={axisLabel.label}
                                        style={{ left: `${getChartPosition(axisLabel.value, distributionRanges)}%` }}
                                    >
                                        {axisLabel.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className={styles.emptyDistribution}>Rating distribution is loading.</p>
                    )}
                </div>

                <div className={styles.legend}>
                    {ratingTiers.map((tier: RatingTier) => {
                        const isActive = tier.id === selectedRatingTier.id

                        return (
                            <div
                                key={tier.id}
                                className={classNames(styles.legendCard, isActive && styles.legendCardActive)}
                                style={({
                                    '--tier-color': tier.color,
                                    '--tier-highlight-color': tier.highlightColor,
                                } as CSSProperties)}
                            >
                                <span className={styles.legendSwatch} />
                                <span className={styles.legendRange}>{tier.rangeLabel}</span>
                                <span className={styles.legendLabel}>{tier.label}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </BaseModal>
    )
}

export default MemberRatingInfoModal
