import { ChallengeListParams } from '../services'

/**
 * Bucket ids used by challenge listing tabs.
 */
export enum ChallengeBucket {
    OpenForRegistration = 'open-for-registration',
    My = 'my',
    Ongoing = 'ongoing',
    All = 'all',
    AllPast = 'all-past',
    MyPast = 'my-past',
}

/**
 * Visible label for each challenge bucket.
 */
export const BUCKET_LABELS: Record<ChallengeBucket, string> = {
    [ChallengeBucket.OpenForRegistration]: 'Open for Registration',
    [ChallengeBucket.My]: 'My Challenges',
    [ChallengeBucket.Ongoing]: 'Ongoing',
    [ChallengeBucket.All]: 'All',
    [ChallengeBucket.AllPast]: 'All Past',
    [ChallengeBucket.MyPast]: 'My Past',
}

/**
 * Sort options displayed in the challenge listing filter bar.
 */
export const SORT_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
    { label: 'Most Recent', value: 'startDate' },
    { label: 'Prize High to Low', value: 'overview.totalPrizes-high-to-low' },
    { label: 'Prize Low to High', value: 'overview.totalPrizes-low-to-high' },
    { label: 'Title A-Z', value: 'name' },
]

/**
 * Converts a bucket selection into challenge API params.
 *
 * @param bucket Selected listing bucket.
 * @param memberId Logged in member id for member-scoped buckets.
 * @returns Partial challenge query params for the bucket.
 */
export function bucketToParams(
    bucket: ChallengeBucket,
    memberId?: string,
): Partial<ChallengeListParams> {
    switch (bucket) {
        case ChallengeBucket.OpenForRegistration:
            return {
                currentPhaseName: 'Registration',
                status: 'Active',
            }
        case ChallengeBucket.My:
            return {
                memberId,
                status: 'Active',
            }
        case ChallengeBucket.Ongoing:
            return {
                status: 'Active',
            }
        case ChallengeBucket.All:
            return {
                status: 'Active',
            }
        case ChallengeBucket.AllPast:
            return {
                status: 'Completed',
            }
        case ChallengeBucket.MyPast:
            return {
                memberId,
                status: 'Completed',
            }
        default:
            return {}
    }
}
