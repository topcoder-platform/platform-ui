export enum ChallengeStatus {
    New = 'NEW',
    Draft = 'DRAFT',
    Approved = 'APPROVED',
    Active = 'ACTIVE',
    Completed = 'COMPLETED',
    Deleted = 'DELETED',
    Cancelled = 'CANCELLED',
    CancelledFailedReview = 'CANCELLED_FAILED_REVIEW',
    CancelledFailedScreening = 'CANCELLED_FAILED_SCREENING',
    CancelledZeroSubmissions = 'CANCELLED_ZERO_SUBMISSIONS',
    CancelledWinnerUnresponsive = 'CANCELLED_WINNER_UNRESPONSIVE',
    CancelledClientRequest = 'CANCELLED_CLIENT_REQUEST',
    CancelledRequirementsInfeasible = 'CANCELLED_REQUIREMENTS_INFEASIBLE',
    CancelledZeroRegistrations = 'CANCELLED_ZERO_REGISTRATIONS',
    CancelledPaymentFailed = 'CANCELLED_PAYMENT_FAILED',
}

export type ChallengeType = {
    id: string
    name: string
    abbreviation: string
}

export type ChallengeTrack = {
    id: string
    name: string
    abbreviation: string
}

export type ChallengeWinner = {
    userId: number
    handle: string
    placement: number
    type?: string
}

export type ChallengePrize = {
    description?: string
    type: string
    value: number
}

export type ChallengePrizeSet = {
    description?: string
    type: string
    prizes: ChallengePrize[]
}

export interface Challenge {
    /** Challenge UUID. */
    id: string
    /** Challenge name. */
    name: string
    /** Direct-app project ID. */
    legacyId: string
    /** Challenge type. */
    type: ChallengeType
    /** Type UUID. */
    typeId: string
    /** Challenge track. */
    track: ChallengeTrack
    legacy: {
        subTrack: string
    }
    /** Challenge status. */
    status: ChallengeStatus
    /** Connect-app project ID. */
    projectId: number
    /** Number of registrants. */
    numOfRegistrants: number
    /** Number of submissions. */
    numOfSubmissions: number
    /** Challenge groups. */
    groups: Array<object>
    /** Challenge phases. */
    phases: Array<{ name: string; isOpen: boolean; scheduledEndDate: string }>
    tags: Array<string>
    winners?: ChallengeWinner[]
    prizeSets?: ChallengePrizeSet[]
    /** Challenge billing info. */
    billing?: {
        billingAccountId?: string | number
    }
}
