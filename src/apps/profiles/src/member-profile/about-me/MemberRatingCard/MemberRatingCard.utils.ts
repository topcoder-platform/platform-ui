import { UserStats, UserStatsDistributionResponse } from '~/libs/core'

interface RatingDistributionQuery {
    subTrack: string
    track: string
}

interface RatingDistributionRange {
    end: number
    start: number
    value: number
}

const aiEngineeringTrackNames: Set<string> = new Set([
    'AI',
    'AI_ENGINEER',
    'AI_ENGINEERING',
])

const testingSubTrackNames: Set<string> = new Set([
    'BUG_HUNT',
    'TEST_SCENARIOS',
    'TEST_SUITES',
])

const ratingAudienceLabels: {[key: string]: string} = {
    DATA_SCIENCE: 'Data Scientists',
    DATASCIENCE: 'Data Scientists',
    DESIGN: 'Designers',
    DEV: 'Developers',
    DEVELOP: 'Developers',
    DEVELOPMENT: 'Developers',
    QA: 'QA Professionals',
    QUALITY_ASSURANCE: 'QA Professionals',
    TESTING: 'QA Professionals',
}

/**
 * Returns a normalized track or subtrack token for lookup.
 *
 * @param {string | undefined} value - Raw track or subtrack value from member stats.
 * @returns {string} Uppercase token with spaces and hyphens converted to underscores.
 */
const normalizeTrackToken = (value?: string): string => (
    value?.trim()
        .toUpperCase()
        .replace(/[\s-]+/g, '_') ?? ''
)

/**
 * Returns a finite number from unknown API data when the value can be used in math.
 *
 * @param {unknown} value - A raw API value that may or may not be numeric.
 * @returns {number | undefined} The numeric value when it is finite, otherwise undefined.
 */
const getFiniteNumber = (value: unknown): number | undefined => (
    typeof value === 'number' && Number.isFinite(value) ? value : undefined
)

/**
 * Splits preferred role text into display-ready role labels.
 *
 * @param {string | undefined} preferredRolesText - Text from the profile preferred roles field.
 * @returns {string[]} Cleaned role labels for the compact profile role list.
 */
export const parsePreferredRolesText = (preferredRolesText?: string): string[] => (
    (preferredRolesText ?? '')
        .split(/[\n,;\u00b7\u2022]+/)
        .map((role: string) => role.trim()
            .replace(/^[-*]\s+/, ''))
        .filter(Boolean)
)

/**
 * Parses the stats distribution API response into sorted rating ranges.
 *
 * @param {UserStatsDistributionResponse['distribution'] | undefined} distribution - Raw distribution buckets.
 * @returns {RatingDistributionRange[]} Sorted numeric ranges with member counts.
 */
const getDistributionRanges = (
    distribution?: UserStatsDistributionResponse['distribution'],
): RatingDistributionRange[] => (
    Object.entries(distribution ?? {})
        .map(([key, value]: [string, number]) => {
            const match: RegExpMatchArray | null = key.match(/ratingRange(\d+)To(\d+)/)

            return {
                end: match ? parseInt(match[2], 10) : Number.NaN,
                start: match ? parseInt(match[1], 10) : Number.NaN,
                value,
            }
        })
        .filter((range: RatingDistributionRange) => (
            Number.isFinite(range.start)
            && Number.isFinite(range.end)
            && Number.isFinite(range.value)
            && range.value > 0
        ))
        .sort((rangeA: RatingDistributionRange, rangeB: RatingDistributionRange) => rangeA.start - rangeB.start)
)

/**
 * Calculates the visible "Top X%" value from the rating distribution.
 *
 * The distribution only gives bucket counts, so when a rating falls inside a
 * bucket this assumes members are evenly distributed across that bucket and
 * counts the proportional share at or above the member rating.
 *
 * @param {UserStatsDistributionResponse['distribution'] | undefined} distribution - Raw rating distribution buckets.
 * @param {number | undefined} memberRating - The member's maximum rating in the same track/subtrack.
 * @returns {number | undefined} Top percentage when the distribution and rating are available.
 */
export const calculateTopPercentileFromDistribution = (
    distribution: UserStatsDistributionResponse['distribution'] | undefined,
    memberRating: number | undefined,
): number | undefined => {
    const rating = getFiniteNumber(memberRating)
    const ranges = getDistributionRanges(distribution)
    const totalMembers = ranges.reduce((
        total: number,
        range: RatingDistributionRange,
    ) => total + range.value, 0)

    if (rating === undefined || totalMembers <= 0) {
        return undefined
    }

    const membersAtOrAboveRating = ranges.reduce((
        total: number,
        range: RatingDistributionRange,
    ) => {
        if (rating <= range.start) {
            return total + range.value
        }

        if (rating > range.end) {
            return total
        }

        const rangeSize = range.end - range.start + 1
        const ratingAndAboveSize = range.end - rating + 1

        return total + (range.value * (ratingAndAboveSize / rangeSize))
    }, 0)

    if (membersAtOrAboveRating <= 0) {
        return undefined
    }

    return (membersAtOrAboveRating / totalMembers) * 100
}

/**
 * Returns the distribution query that corresponds to the user's maximum rating track.
 *
 * @param {UserStats | undefined} memberStats - The raw stats payload for the user.
 * @returns {RatingDistributionQuery | undefined} The API query for rating distribution data.
 */
export const getRatingDistributionQuery = (memberStats?: UserStats): RatingDistributionQuery | undefined => {
    const maxRating = memberStats?.maxRating

    if (!maxRating?.track || !maxRating?.subTrack) {
        return undefined
    }

    if (aiEngineeringTrackNames.has(normalizeTrackToken(maxRating.track))) {
        return {
            subTrack: 'AI',
            track: 'DATA_SCIENCE',
        }
    }

    return {
        subTrack: maxRating.subTrack,
        track: maxRating.track,
    }
}

/**
 * Returns the audience label shown after the member's top percentile.
 *
 * @param {UserStats | undefined} memberStats - The raw stats payload for the user.
 * @returns {string} The broad track audience label for the rating card and modal.
 */
export const getRatingAudienceLabel = (memberStats?: UserStats): string => {
    const maxRating = memberStats?.maxRating
    const normalizedTrack = normalizeTrackToken(maxRating?.track)
    const normalizedSubTrack = normalizeTrackToken(maxRating?.subTrack)

    if (testingSubTrackNames.has(normalizedSubTrack)) {
        return ratingAudienceLabels.QA
    }

    return ratingAudienceLabels[normalizedTrack] ?? 'Members'
}
