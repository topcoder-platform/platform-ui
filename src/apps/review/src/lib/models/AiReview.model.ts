export type AiReviewDecisionStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'ERROR' | 'HUMAN_OVERRIDE'

export type AiReviewDecisionEscalationStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

export interface AiReviewDecisionEscalation {
    id: string
    aiReviewDecisionId: string
    escalationNotes: string | null
    approverNotes: string | null
    status: AiReviewDecisionEscalationStatus
    createdAt: string
    createdBy: string | null
    updatedAt: string
    updatedBy: string | null
}

export interface AiReviewConfigWorkflow {
    id: string
    workflowId: string
    weightPercent: number
    isGating: boolean
    workflow?: {
        id?: string
        name?: string
        description?: string
        scorecard?: {
            minimumPassingScore?: number
        }
    }
}

export interface AiReviewConfig {
    id: string
    challengeId: string
    version: number
    minPassingThreshold: number
    mode: string
    autoFinalize: boolean
    formula?: Record<string, unknown>
    templateId?: string | null
    createdAt: string
    updatedAt: string
    workflows: AiReviewConfigWorkflow[]
}

export interface AiReviewDecisionBreakdownWorkflow {
    workflowId: string
    weightPercent: number
    isGating: boolean
    minimumPassingScore: number
    runId: string | null
    runStatus: string | null
    runScore: number | null
}

export interface AiReviewDecisionBreakdown {
    evaluatedAt?: string
    mode?: string
    weightedTotal?: number
    minPassingThreshold?: number
    hasBlockingGatingFailure?: boolean
    workflows?: AiReviewDecisionBreakdownWorkflow[]
}

export interface AiReviewDecision {
    id: string
    submissionId: string
    configId: string
    status: AiReviewDecisionStatus
    totalScore: number | null
    submissionLocked: boolean
    reason: string | null
    breakdown: AiReviewDecisionBreakdown | null
    isFinal: boolean
    finalizedAt: string | null
    createdAt: string
    updatedAt: string
    escalations?: AiReviewDecisionEscalation[]
}
