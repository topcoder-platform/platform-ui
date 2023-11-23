export type SRMDivisionStats = {
    levelName: string
    problemsFailed: number
    problemsSubmitted: number
    problemsSysByTest: number
}

export type SERMChallengeStats = {
    levelName: string
    challenges: number
    failedChallenges: number
}

export type SRMStats = {
    challenges: number
    division1: Array<SRMDivisionStats>
    division2: Array<SRMDivisionStats>
    challengeDetails: Array<SERMChallengeStats>
    mostRecentEventDate: number
    mostRecentEventName: string
    mostRecentSubmission: number
    rank: {
        maximumRating: number
        rating: number
        rank: number
        percentile: number
        competitions: number
        volatility: number
    }
    wins: number
    parentTrack?: string
    path?: string
}

export type MemberStats = {
    avgPlacement: number
    challenges: number
    rank: {
        maximumRating: number
        rating: number
        rank: 0
        percentile: number
        competitions: number
        volatility: number
        overallRank: number
        overallPercentile: number
    }
    submissionRate: number
    screeningSuccessRate: number
    wins: number
    name: string
    submissions: {
        submissions: number
    }
    parentTrack?: string
    path?: string
}

export type UserStats = {
    groupId: number
    handle: string
    handleLower: string
    challenges: number
    userId: number
    wins: number
    maxRating?: {
        rating: number
        ratingColor: string
        subTrack: string
        track: string
    }
    COPILOT?: {
        activeContests: number
        activeProjects: number
        contests: number
        failures: number
        fulfillment: number
        projects: number
        reposts: number
    }
    DATA_SCIENCE?: {
        MARATHON_MATCH: MemberStats
        SRM: SRMStats
        challenges: number
        mostRecentEventDate: number
        mostRecentEventName: string
        mostRecentSubmission: number
        wins: number
    }
    DEVELOP?: {
        challenges: number
        mostRecentEventDate: number
        mostRecentSubmission: number
        subTracks: Array<MemberStats>
        wins: number
    }
    DESIGN?: {
        challenges: number
        mostRecentEventDate: number
        mostRecentSubmission: number
        subTracks: Array<MemberStats>
        wins: number
    }
}

export type StatsHistory = {
    challengeId: number
    challengeName: string
    date?: number
    percentile?: number
    placement?: number
    rating?: number
    newRating: number
    ratingDate: number
}

export type UserStatsHistory = {
    groupId: number
    handle: string
    handleLower: string
    userId: number
    DATA_SCIENCE?: {
        SRM?: {
            history: Array<StatsHistory>
        },
        MARATHON_MATCH?: {
            history: Array<StatsHistory>
        }
    }
    DEVELOP?: {
        subTracks: Array<{
            name: string
            history: Array<StatsHistory>
        }>
    }
}
