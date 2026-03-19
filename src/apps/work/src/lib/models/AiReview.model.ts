import { Workflow } from './Reviewer.model'

export type AiReviewMode = 'AI_GATING' | 'AI_ONLY'

export interface AiReviewWorkflowDetails extends Partial<Workflow> {
    scorecard?: {
        id?: string
        name?: string
    }
}

export interface AiReviewConfigWorkflow {
    id?: string
    isGating: boolean
    weightPercent: number
    workflow?: AiReviewWorkflowDetails
    workflowId: string
}

export interface AiReviewConfig {
    autoFinalize: boolean
    challengeId: string
    createdAt?: string | Date
    decisions?: Record<string, unknown>[]
    formula?: Record<string, unknown>
    id: string
    minPassingThreshold: number
    mode: AiReviewMode
    templateId?: string
    updatedAt?: string | Date
    version?: number
    workflows: AiReviewConfigWorkflow[]
}

export interface AiReviewTemplate {
    autoFinalize: boolean
    challengeTrack: string
    challengeType: string
    createdAt?: string | Date
    description: string
    formula?: Record<string, unknown>
    id: string
    minPassingThreshold: number
    mode: AiReviewMode
    title: string
    updatedAt?: string | Date
    version?: number
    workflows: AiReviewConfigWorkflow[]
}
