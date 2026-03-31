/**
 * Supported QA runner variants.
 */
export type FlowVariant =
    | 'full'
    | 'first2finish'
    | 'topgear'
    | 'topgearLate'
    | 'design'
    | 'designFailScreening'
    | 'designFailReview'
    | 'designSingle'

/**
 * Page view modes supported by the QA home page.
 */
export type ViewState = 'home' | 'edit' | 'runFull' | 'runToStep'

/**
 * Run mode accepted by the QA runner stream endpoint.
 */
export type RunMode = 'full' | 'toStep'

/**
 * Prize tuple used by full-style challenge configs.
 */
export type PrizeTuple = [number, number, number]

/**
 * Flow step descriptor rendered in the runner.
 */
export interface FlowStep {
    id: string
    label: string
}

/**
 * Full challenge QA configuration.
 */
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

/**
 * Iterative challenge QA configuration shared by First2Finish and Topgear.
 */
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

/**
 * Topgear task configuration.
 */
export type TopgearConfig = First2FinishConfig

/**
 * Design challenge QA configuration.
 */
export interface DesignConfig {
    challengeNamePrefix: string
    projectId: number
    challengeTypeId: string
    challengeTrackId: string
    timelineTemplateId: string
    copilotHandle: string
    reviewer: string
    screener?: string
    screeningReviewer?: string
    approver?: string
    checkpointScreener?: string
    checkpointReviewer?: string
    submitters: string[]
    submissionsPerSubmitter: number
    scorecardId: string
    reviewScorecardId?: string
    screeningScorecardId?: string
    approvalScorecardId?: string
    checkpointScorecardId: string
    checkpointScreeningScorecardId?: string
    checkpointReviewScorecardId?: string
    prizes: PrizeTuple
    checkpointPrizeAmount: number
    checkpointPrizeCount: number
    submissionZipPath: string
}

/**
 * Persisted QA app configuration.
 */
export interface AppConfig {
    fullChallenge: FullChallengeConfig
    first2finish: First2FinishConfig
    topgear: TopgearConfig
    designChallenge: DesignConfig
    designFailScreeningChallenge: DesignConfig
    designFailReviewChallenge: DesignConfig
    designSingleChallenge: FullChallengeConfig
}

/**
 * Config shape rendered by flow-specific UI sections.
 */
export type FlowConfig = FullChallengeConfig | First2FinishConfig | DesignConfig

/**
 * Challenge type option returned by QA refdata endpoints.
 */
export interface ChallengeTypeOption {
    id: string
    name: string
}

/**
 * Challenge track option returned by QA refdata endpoints.
 */
export interface ChallengeTrackOption {
    id: string
    name: string
    track?: string
}

/**
 * Scorecard option returned by QA refdata endpoints.
 */
export interface ScorecardOption {
    id: string
    name: string
}

/**
 * Timeline template option rendered in the QA config form.
 */
export interface TimelineTemplateOption {
    id: string
    name: string
    trackId?: string
    typeId?: string
}

/**
 * Project option rendered in the QA config form.
 */
export interface ProjectOption {
    id: string
    name: string
    label: string
}

/**
 * Member option rendered in single-handle QA autocomplete inputs.
 */
export interface MemberOption {
    label: string
    value: string
}

/**
 * Stream log entry emitted by the QA run API.
 */
export interface LogEntry {
    level: string
    message: string
    data?: unknown
    progress?: number
}

/**
 * Captured challenge snapshot from the run stream.
 */
export interface ChallengeSnapshot {
    id: number
    stage?: string
    timestamp: string
    challenge: unknown
}

/**
 * Runner step status used by the step board.
 */
export type StepStatus = 'pending' | 'in-progress' | 'success' | 'failure'

/**
 * Request log captured for a specific runner step.
 */
export interface StepRequestLog {
    id: string
    method?: string
    endpoint?: string
    status?: number
    message?: string
    requestBody?: unknown
    responseBody?: unknown
    responseHeaders?: Record<string, unknown>
    timestamp?: string
    durationMs?: number
    outcome: 'success' | 'failure'
}

/**
 * Structured step event emitted by the stream.
 */
export interface StepEvent {
    type: 'step'
    step: string
    status: StepStatus
    requests?: StepRequestLog[]
    failedRequests?: StepRequestLog[]
    timestamp: string
}

/**
 * Step-to-request lookup used by the request inspector.
 */
export type StepRequestMap = Partial<Record<string, StepRequestLog[]>>
