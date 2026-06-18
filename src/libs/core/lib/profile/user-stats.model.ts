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
    id: number,
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

/**
 * Top-level track stats returned by the member stats API.
 *
 * Some newer tracks are returned as a group with subtracks, while others can be returned
 * directly as a stats object. This type keeps those optional payloads narrow enough for
 * profile rendering without forcing every API field to be present.
 */
export type MemberStatsGroup = Partial<MemberStats> & {
    challengePoints?: number
    subTracks?: Array<MemberStats>
}

/**
 * Sparse stats object returned for configured DATA_SCIENCE rating paths.
 *
 * Custom rating paths such as `AI` are stored under their configured path name
 * and may only include counters plus the rank fields currently available for
 * that path.
 */
export type DataScienceRatingPathStats = Partial<Omit<MemberStats, 'rank' | 'name'>> & {
    name?: string
    rank?: Partial<MemberStats['rank']>
}

export type DataScienceStats = {
    Challenge?: MemberStats
    MARATHON_MATCH?: MemberStats
    SRM?: SRMStats
    challenges?: number
    mostRecentEventDate?: number
    mostRecentEventName?: string
    mostRecentSubmission?: number
    wins?: number
    [ratingPath: string]: DataScienceRatingPathStats | MemberStats | SRMStats | number | string | undefined
}

export type UserStats = {
    groupId: number
    handle: string
    handleLower: string
    challengePoints?: number
    CHALLENGE_POINTS?: number
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
    DATA_SCIENCE?: DataScienceStats
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
    QA?: {
        challenges: number
        mostRecentEventDate: number
        mostRecentSubmission: number
        subTracks: Array<MemberStats>
        wins: number
    }
    AI?: MemberStatsGroup
    AI_ENGINEER?: MemberStatsGroup
    AI_ENGINEERING?: MemberStatsGroup
}

export type StatsHistory = {
    challengeId: string | number
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
    DESIGN?: {
        subTracks: Array<{
            name: string
            history: Array<StatsHistory>
        }>
    }
    DATA_SCIENCE?: {
        Challenge?: {
            history: Array<StatsHistory>
        },
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
    QA?: {
        subTracks: Array<{
            name: string
            history: Array<StatsHistory>
        }>
    }
}
