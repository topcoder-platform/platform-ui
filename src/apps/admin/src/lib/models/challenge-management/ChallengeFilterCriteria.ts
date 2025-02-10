import { ChallengeStatus, ChallengeTrack, ChallengeType } from './Challenge'

export type ChallengeFilterCriteria = {
    /** Pagination current page. */
    page: number
    /** Pagination page size. */
    perPage: number
    /** Challenge name. */
    name: string
    /** Challenge UUID. */
    challengeId: string
    /** Challenge legacy ID. */
    legacyId: number
    /** Challenge type. */
    type: ChallengeType['abbreviation']
    /** Challenge track. */
    track: ChallengeTrack['abbreviation']
    /** Challenge status. */
    status: ChallengeStatus
}
