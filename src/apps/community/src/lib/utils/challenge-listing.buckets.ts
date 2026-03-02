import { ChallengeListParams } from '../services'

/**
 * Bucket ids used by challenge listing tabs.
 */
export enum ChallengeBucket {
    ActiveChallenges = 'active-challenges',
    PastChallenges = 'past-challenges',
    Engagements = 'engagements',
}

/**
 * Visible label for each challenge bucket.
 */
export const BUCKET_LABELS: Record<ChallengeBucket, string> = {
    [ChallengeBucket.ActiveChallenges]: 'Active Challenges',
    [ChallengeBucket.PastChallenges]: 'Past Challenges',
    [ChallengeBucket.Engagements]: 'Engagements',
}

/**
 * Sort options displayed in the challenge listing filter bar.
 */
export const SORT_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
    { label: 'Most recent', value: 'startDate' },
    { label: 'Prize high to low', value: 'overview.totalPrizes-high-to-low' },
    { label: 'Prize low to high', value: 'overview.totalPrizes-low-to-high' },
    { label: 'Title A–Z', value: 'name' },
]

/**
 * Converts a bucket selection into challenge API params.
 *
 * @param bucket Selected listing bucket.
 * @param memberId Logged in member id for member-scoped mappings.
 * @returns Partial challenge query params for the bucket.
 */
export function bucketToParams(
    bucket: ChallengeBucket,
    memberId?: string,
): Partial<ChallengeListParams> {
    switch (bucket) {
        case ChallengeBucket.ActiveChallenges:
            return {
                status: 'Active',
            }
        case ChallengeBucket.PastChallenges:
            return {
                status: 'Completed',
            }
        case ChallengeBucket.Engagements:
            return {
                memberId,
                types: ['TSK'],
            }
        default:
            return {}
    }
}
