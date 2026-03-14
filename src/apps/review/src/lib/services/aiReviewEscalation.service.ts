import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPatchAsync, xhrPostAsync } from '~/libs/core'

export type AiReviewEscalationStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

export interface AiReviewDecisionEscalation {
    id: string
    aiReviewDecisionId: string
    escalationNotes: string | null
    approverNotes: string | null
    status: AiReviewEscalationStatus
    createdAt: string
    createdBy: string | null
    updatedAt: string
    updatedBy: string | null
}

export interface AiReviewEscalationDecision {
    aiReviewDecisionId: string
    submissionId: string
    challengeId: string | undefined
    decisionStatus: string
    submissionLocked: boolean
    escalations: AiReviewDecisionEscalation[]
}

interface ListAiReviewEscalationsParams {
    challengeId?: string
    submissionId?: string
    aiReviewDecisionId?: string
    status?: AiReviewEscalationStatus
    submissionLocked?: boolean
}

interface CreateAiReviewEscalationPayload {
    escalationNotes?: string
    approverNotes?: string
}

interface UpdateAiReviewEscalationPayload {
    approverNotes: string
    status: Extract<AiReviewEscalationStatus, 'APPROVED' | 'REJECTED'>
}

const v6BaseUrl = `${EnvironmentConfig.API.V6}`

export const getAiReviewEscalationsCacheKey = (params: ListAiReviewEscalationsParams): string => {
    const query = new URLSearchParams()

    if (params.challengeId) query.set('challengeId', params.challengeId)
    if (params.submissionId) query.set('submissionId', params.submissionId)
    if (params.aiReviewDecisionId) query.set('aiReviewDecisionId', params.aiReviewDecisionId)
    if (params.status) query.set('status', params.status)
    if (params.submissionLocked !== undefined) query.set('submissionLocked', String(params.submissionLocked))

    return `${v6BaseUrl}/ai-review/escalations?${query.toString()}`
}

export const fetchAiReviewEscalations = async (
    params: ListAiReviewEscalationsParams,
): Promise<AiReviewEscalationDecision[]> => (
    xhrGetAsync<AiReviewEscalationDecision[]>(getAiReviewEscalationsCacheKey(params))
)

export const createAiReviewEscalation = async (
    aiReviewDecisionId: string,
    payload: CreateAiReviewEscalationPayload,
): Promise<AiReviewDecisionEscalation> => (
    xhrPostAsync<CreateAiReviewEscalationPayload, AiReviewDecisionEscalation>(
        `${v6BaseUrl}/ai-review/decisions/${aiReviewDecisionId}/escalation`,
        payload,
    )
)

export const updateAiReviewEscalation = async (
    aiReviewDecisionId: string,
    escalationId: string,
    payload: UpdateAiReviewEscalationPayload,
): Promise<AiReviewDecisionEscalation> => (
    xhrPatchAsync<UpdateAiReviewEscalationPayload, AiReviewDecisionEscalation>(
        `${v6BaseUrl}/ai-review/decisions/${aiReviewDecisionId}/escalation/${escalationId}`,
        payload,
    )
)
