import type { UserStats, UserStatsDistributionResponse } from '~/libs/core'

interface RatingCandidate {
    rating: number
    ratingDate: number
    subTrack: string
    track: string
}

interface RatingDistributionQuery {
    subTrack: string
    track: string
}

interface RatingDistributionRange {
    end: number
    start: number
    value: number
}

export interface PreferredRolesDisplay {
    hiddenCount: number
    toggleLabel: string | undefined
    visibleRoles: string[]
}

type StatsRecord = Record<string, unknown>

const maxCollapsedPreferredRoles = 2
const lowestRatingTierLimit = 900
const compactLowestRatingColor = '#7F7F7F'

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
    AI: 'Data Scientists',
    AI_ENGINEER: 'Data Scientists',
    AI_ENGINEERING: 'Data Scientists',
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
 * Checks whether an unknown API value can be read as an object record.
 *
 * @param {unknown} value - A raw API value.
 * @returns {boolean} True when the value is a non-array object record.
 */
const isStatsRecord = (value: unknown): value is StatsRecord => (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
)

/**
 * Returns a stat entry's display name when it is present.
 *
 * @param {unknown} stats - Raw subtrack or rating-path stats from the member stats API.
 * @param {string} fallbackName - Name to use when the stats object does not include one.
 * @returns {string} A usable subtrack name for rating metadata.
 */
const getStatsName = (stats: unknown, fallbackName: string): string => {
    if (!isStatsRecord(stats) || typeof stats.name !== 'string') {
        return fallbackName
    }

    const statsName = stats.name.trim()

    return statsName || fallbackName
}

/**
 * Builds a rating candidate from a stats object that includes rank.rating.
 *
 * The member stats API stores the current rating at `rank.rating` and the
 * event timestamp at `mostRecentEventDate`. Entries without a finite rating
 * are ignored because unrated subtracks should not drive the profile rating.
 *
 * @param {unknown} stats - Raw subtrack or rating-path stats from the member stats API.
 * @param {string} track - API track that owns the stats entry.
 * @param {string} subTrack - API subtrack or rating path for the stats entry.
 * @returns {RatingCandidate | undefined} Rating, event date, and track metadata when the stats are rated.
 */
const getRatingCandidate = (
    stats: unknown,
    track: string,
    subTrack: string,
): RatingCandidate | undefined => {
    if (!isStatsRecord(stats) || !isStatsRecord(stats.rank)) {
        return undefined
    }

    const rating: number | undefined = getFiniteNumber(stats.rank.rating)

    if (rating === undefined) {
        return undefined
    }

    return {
        rating,
        ratingDate: getFiniteNumber(stats.mostRecentEventDate) ?? 0,
        subTrack,
        track,
    }
}

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
 * Builds the compact preferred-role display state for the profile rating card.
 *
 * @param {string[]} preferredRoles - Parsed preferred role labels in display order.
 * @param {boolean} areExpanded - Whether the compact list has been expanded by the user.
 * @returns {PreferredRolesDisplay} Visible roles plus the toggle label and collapsed hidden count.
 */
export const getPreferredRolesDisplay = (
    preferredRoles: string[],
    areExpanded: boolean,
): PreferredRolesDisplay => {
    const hiddenCount = Math.max(preferredRoles.length - maxCollapsedPreferredRoles, 0)

    return {
        hiddenCount: areExpanded ? 0 : hiddenCount,
        toggleLabel: hiddenCount > 0
            ? (areExpanded ? 'See less' : `+ ${hiddenCount} more`)
            : undefined,
        visibleRoles: areExpanded
            ? preferredRoles
            : preferredRoles.slice(0, maxCollapsedPreferredRoles),
    }
}

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
 * @param {number | undefined} memberRating - The visible member rating in the same track/subtrack.
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
 * Returns the rating text color for the dark compact profile rating card.
 *
 * The shared grey rating color is too dark against the compact card background,
 * so the lowest rating tier is mapped to the lighter grey palette value while
 * all other rating tiers continue to use the shared Topcoder rating color passed in.
 * Used by MemberRatingCard for the rating value and top-percentile badge.
 *
 * @param {number | undefined} rating - The profile rating rendered in the compact card.
 * @param {string} ratingColor - Shared Topcoder rating color for the same rating.
 * @returns {string} Hex color to use for compact card rating text.
 * @throws Does not throw.
 */
export const getCompactRatingColor = (rating: number | undefined, ratingColor: string): string => (
    rating !== undefined && rating < lowestRatingTierLimit
        ? compactLowestRatingColor
        : ratingColor
)

/**
 * Extracts rated candidates from a design or development subtrack list.
 *
 * @param {string} track - API track that owns the subtracks.
 * @param {unknown} subTracks - Raw `subTracks` array from member stats.
 * @returns {RatingCandidate[]} Rated subtracks available for profile rating selection.
 */
const getSubTrackRatingCandidates = (track: string, subTracks: unknown): RatingCandidate[] => (
    Array.isArray(subTracks)
        ? subTracks
            .map((subTrack: unknown) => getRatingCandidate(
                subTrack,
                track,
                getStatsName(subTrack, track),
            ))
            .filter((candidate: RatingCandidate | undefined): candidate is RatingCandidate => candidate !== undefined)
        : []
)

/**
 * Extracts rated candidates from native and configured DATA_SCIENCE rating paths.
 *
 * @param {unknown} dataScienceStats - Raw DATA_SCIENCE stats from member stats.
 * @returns {RatingCandidate[]} Rated data science paths available for profile rating selection.
 */
const getDataScienceRatingCandidates = (dataScienceStats: unknown): RatingCandidate[] => (
    isStatsRecord(dataScienceStats)
        ? Object.entries(dataScienceStats)
            .map(([subTrack, stats]: [string, unknown]) => getRatingCandidate(stats, 'DATA_SCIENCE', subTrack))
            .filter((candidate: RatingCandidate | undefined): candidate is RatingCandidate => candidate !== undefined)
        : []
)

/**
 * Extracts rated candidates from the known AI Engineering top-level stat aliases.
 *
 * @param {UserStats | undefined} memberStats - Raw member stats for the profile user.
 * @returns {RatingCandidate[]} Rated AI Engineering entries available for profile rating selection.
 */
const getAIEngineeringRatingCandidates = (memberStats?: UserStats): RatingCandidate[] => {
    const aiEngineeringStats = memberStats?.AI_ENGINEERING ?? memberStats?.AI ?? memberStats?.AI_ENGINEER

    return [
        getRatingCandidate(aiEngineeringStats, 'AI_ENGINEERING', getStatsName(aiEngineeringStats, 'AI')),
        ...getSubTrackRatingCandidates('AI_ENGINEERING', aiEngineeringStats?.subTracks),
    ].filter((candidate: RatingCandidate | undefined): candidate is RatingCandidate => candidate !== undefined)
}

/**
 * Builds the fallback rating candidate from the historical maximum rating payload.
 *
 * @param {UserStats | undefined} memberStats - Raw member stats for the profile user.
 * @returns {RatingCandidate | undefined} Max rating candidate when enough metadata is available.
 */
const getMaxRatingCandidate = (memberStats?: UserStats): RatingCandidate | undefined => {
    const maxRating = memberStats?.maxRating
    const rating = getFiniteNumber(maxRating?.rating)

    if (rating === undefined || !maxRating?.track || !maxRating?.subTrack) {
        return undefined
    }

    return {
        rating,
        ratingDate: 0,
        subTrack: maxRating.subTrack,
        track: maxRating.track,
    }
}

/**
 * Returns the latest rated track candidate used by the compact rating card.
 *
 * @param {UserStats | undefined} memberStats - Raw member stats for the profile user.
 * @returns {RatingCandidate | undefined} Latest current rating candidate, or max rating fallback.
 */
const getLatestProfileRatingCandidate = (memberStats?: UserStats): RatingCandidate | undefined => {
    const candidates: RatingCandidate[] = [
        ...getSubTrackRatingCandidates('DEVELOP', memberStats?.DEVELOP?.subTracks),
        ...getSubTrackRatingCandidates('DESIGN', memberStats?.DESIGN?.subTracks),
        ...getDataScienceRatingCandidates(memberStats?.DATA_SCIENCE),
        ...getAIEngineeringRatingCandidates(memberStats),
    ]

    const latestCandidate: RatingCandidate | undefined = candidates.reduce((
        latest: RatingCandidate | undefined,
        candidate: RatingCandidate,
    ) => (
        latest === undefined || candidate.ratingDate > latest.ratingDate ? candidate : latest
    ), undefined)

    return latestCandidate ?? getMaxRatingCandidate(memberStats)
}

/**
 * Returns the rating that should be shown on the compact profile rating card.
 *
 * The card should show the latest current rating from the user's rated tracks,
 * not the historical maximum rating. `maxRating` is used only as a fallback
 * when the stats payload does not include any rated track entries.
 *
 * @param {UserStats | undefined} memberStats - Raw member stats for the profile user.
 * @returns {number | undefined} Latest current rating, or the max rating fallback when no track rating exists.
 */
export const getLatestProfileRating = (memberStats?: UserStats): number | undefined => (
    getLatestProfileRatingCandidate(memberStats)?.rating
)

/**
 * Checks whether a rating candidate should use the configured AI Engineering distribution.
 *
 * @param {RatingCandidate} ratingCandidate - The selected profile rating candidate.
 * @returns {boolean} True when the candidate maps to the configured AI distribution.
 */
const isAIEngineeringRatingCandidate = (ratingCandidate: RatingCandidate): boolean => (
    aiEngineeringTrackNames.has(normalizeTrackToken(ratingCandidate.track))
    || aiEngineeringTrackNames.has(normalizeTrackToken(ratingCandidate.subTrack))
)

/**
 * Returns the distribution query that corresponds to the visible profile rating.
 *
 * @param {UserStats | undefined} memberStats - The raw stats payload for the user.
 * @returns {RatingDistributionQuery | undefined} The API query for rating distribution data.
 */
export const getRatingDistributionQuery = (memberStats?: UserStats): RatingDistributionQuery | undefined => {
    const ratingCandidate = getLatestProfileRatingCandidate(memberStats)

    if (!ratingCandidate) {
        return undefined
    }

    if (isAIEngineeringRatingCandidate(ratingCandidate)) {
        return {
            subTrack: 'AI',
            track: 'DATA_SCIENCE',
        }
    }

    return {
        subTrack: ratingCandidate.subTrack,
        track: ratingCandidate.track,
    }
}

/**
 * Returns the audience label shown after the member's top percentile.
 *
 * @param {UserStats | undefined} memberStats - The raw stats payload for the user.
 * @returns {string} The broad track audience label for the rating card and modal.
 */
export const getRatingAudienceLabel = (memberStats?: UserStats): string => {
    const ratingCandidate = getLatestProfileRatingCandidate(memberStats)
    const normalizedTrack = normalizeTrackToken(ratingCandidate?.track)
    const normalizedSubTrack = normalizeTrackToken(ratingCandidate?.subTrack)

    if (testingSubTrackNames.has(normalizedSubTrack)) {
        return ratingAudienceLabels.QA
    }

    return ratingAudienceLabels[normalizedTrack] ?? 'Members'
}
