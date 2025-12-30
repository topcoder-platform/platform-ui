import type { PrizeTuple } from './flow.types'

export interface FullChallengeConfig {
    challengeNamePrefix: string
    projectId: number
    challengeTypeId: string
    challengeTrackId: string
    timelineTemplateId: string
    copilotHandle: string
    screener?: string
    reviewers: string[]
    submitters: string[]
    submissionsPerSubmitter: number
    scorecardId: string
    prizes: PrizeTuple
    submissionZipPath: string
}

export interface First2FinishConfig {
    challengeNamePrefix: string
    projectId: number
    challengeTypeId: string
    challengeTrackId: string
    timelineTemplateId: string
    copilotHandle: string
    reviewer: string
    submitters: string[]
    scorecardId: string
    prize: number
    submissionZipPath: string
}

export type TopgearConfig = First2FinishConfig

export interface DesignConfig {
    challengeNamePrefix: string
    projectId: number
    challengeTypeId: string
    challengeTrackId: string
    timelineTemplateId: string
    copilotHandle: string
    // Reviewer handles per phase/role
    reviewer: string
    screener?: string
    screeningReviewer?: string
    approver?: string
    checkpointScreener?: string
    checkpointReviewer?: string
    submitters: string[]
    submissionsPerSubmitter: number
    // Default scorecard for all phases, used if specific ones are not set
    scorecardId: string
    // Optional specialized scorecards for each phase
    reviewScorecardId?: string
    screeningScorecardId?: string
    approvalScorecardId?: string
    // Checkpoint-specific scorecards
    checkpointScorecardId: string
    checkpointScreeningScorecardId?: string
    checkpointReviewScorecardId?: string
    prizes: PrizeTuple
    checkpointPrizeAmount: number
    checkpointPrizeCount: number
    submissionZipPath: string
}

export interface AppConfig {
    fullChallenge: FullChallengeConfig
    first2finish: First2FinishConfig
    topgear: TopgearConfig
    designChallenge: DesignConfig
    designFailScreeningChallenge: DesignConfig
    designFailReviewChallenge: DesignConfig
    designSingleChallenge: FullChallengeConfig
}

export type FlowConfigUnion =
    | FullChallengeConfig
    | First2FinishConfig
    | TopgearConfig
    | DesignConfig
