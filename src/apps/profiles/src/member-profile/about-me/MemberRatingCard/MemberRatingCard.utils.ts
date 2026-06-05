import { UserStats } from '~/libs/core'

interface RatingCandidate {
    rating: number
    ratingDate: number
}

type StatsRecord = Record<string, unknown>

/**
 * Returns a finite number from unknown API data when the value can be used for rating comparisons.
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
 * Builds a rating candidate from a stats object that includes rank.rating.
 *
 * The member stats API stores the current rating at `rank.rating` and the
 * event timestamp at `mostRecentEventDate`. Entries without a finite rating
 * are ignored because unrated subtracks should not drive the profile rating.
 *
 * @param {unknown} stats - Raw subtrack or rating-path stats from the member stats API.
 * @returns {RatingCandidate | undefined} Rating and event date when the stats are rated.
 */
const getRatingCandidate = (stats: unknown): RatingCandidate | undefined => {
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
    }
}

/**
 * Extracts rated candidates from a design or development subtrack list.
 *
 * @param {unknown} subTracks - Raw `subTracks` array from member stats.
 * @returns {RatingCandidate[]} Rated subtracks available for profile rating selection.
 */
const getSubTrackRatingCandidates = (subTracks: unknown): RatingCandidate[] => (
    Array.isArray(subTracks)
        ? subTracks
            .map(getRatingCandidate)
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
        ? Object.values(dataScienceStats)
            .map(getRatingCandidate)
            .filter((candidate: RatingCandidate | undefined): candidate is RatingCandidate => candidate !== undefined)
        : []
)

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
export const getLatestProfileRating = (memberStats?: UserStats): number | undefined => {
    const candidates: RatingCandidate[] = [
        ...getSubTrackRatingCandidates(memberStats?.DEVELOP?.subTracks),
        ...getSubTrackRatingCandidates(memberStats?.DESIGN?.subTracks),
        ...getDataScienceRatingCandidates(memberStats?.DATA_SCIENCE),
    ]

    const latestCandidate: RatingCandidate | undefined = candidates.reduce((
        latest: RatingCandidate | undefined,
        candidate: RatingCandidate,
    ) => (
        latest === undefined || candidate.ratingDate > latest.ratingDate ? candidate : latest
    ), undefined)

    return latestCandidate?.rating ?? memberStats?.maxRating?.rating
}
