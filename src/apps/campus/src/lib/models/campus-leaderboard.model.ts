/**
 * Shapes returned by the campus leaderboard report endpoint.
 */

export type CampusChallengeFilter = 'all' | 'public' | 'campus'

export interface CampusParticipation {
    challengeEndDate: string | null
    challengeId: string
    challengeName: string | null
    challengeStatus: string | null
    challengeTrack: string | null
    challengeType: string | null
    isCampusChallenge: boolean
    isPublicChallenge: boolean
    passedReview: boolean
    placement: number | null
    registered: boolean
    registeredAt: string | null
    score: number | null
    submitted: boolean
    submittedDate: string | null
    won: boolean
}

export interface CampusLeaderboardMember {
    challenges: CampusParticipation[]
    firstName: string | null
    handle: string | null
    hasActivity: boolean
    lastName: string | null
    memberSince: string | null
    passingSubmissions: number
    photoURL: string | null
    rank: number
    rating: number | null
    ratingColor: string | null
    registrations: number
    signupDate: string | null
    submissions: number
    userId: string
    wins: number
}

export interface CampusLeaderboardSummary {
    membersRegistered: number
    membersSubmitted: number
    totalMembers: number
}

export interface CampusLeaderboardGroup {
    id: string
    name: string
    oldId: string | null
    privateGroup: boolean
}

export interface CampusLeaderboard {
    challengeFilter: CampusChallengeFilter
    group: CampusLeaderboardGroup
    members: CampusLeaderboardMember[]
    summary: CampusLeaderboardSummary
}
