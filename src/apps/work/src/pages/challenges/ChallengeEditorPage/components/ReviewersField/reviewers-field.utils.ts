import {
    AiReviewConfig,
    AiReviewConfigWorkflow,
    AiReviewMode,
    ChallengePhase,
    Reviewer,
    Workflow,
} from '../../../../../lib/models'

const TEMPLATE_TRACK_ALIASES: Record<string, string> = {
    DATA_SCIENCE: 'DATA_SCIENCE',
    DATASCIENCE: 'DATA_SCIENCE',
    DES: 'DESIGN',
    DESIGN: 'DESIGN',
    DEV: 'DEVELOPMENT',
    DEVELOP: 'DEVELOPMENT',
    DEVELOPMENT: 'DEVELOPMENT',
    DS: 'DATA_SCIENCE',
    QA: 'QUALITY_ASSURANCE',
    QUALITY_ASSURANCE: 'QUALITY_ASSURANCE',
    QUALITYASSURANCE: 'QUALITY_ASSURANCE',
}

export interface AiReviewConfigurationDraft {
    autoFinalize?: boolean
    challengeId?: string
    minPassingThreshold?: number
    mode?: AiReviewMode
    templateId?: string
    workflows?: AiReviewConfigWorkflow[]
}

function toBoolean(value: unknown): boolean {
    return value === true
}

function toNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined
    }

    const parsedValue = Number(value)

    return Number.isFinite(parsedValue)
        ? parsedValue
        : undefined
}

/**
 * Normalizes reviewer-related text fields for comparisons and payload mapping.
 */
export function normalizeReviewerText(value: unknown): string {
    if (value === undefined || value === null) {
        return ''
    }

    return String(value)
        .trim()
}

/**
 * Returns whether a reviewer entry represents an AI reviewer assignment.
 */
export function isAiReviewer(reviewer: Reviewer | undefined): boolean {
    return !!reviewer && (
        !!normalizeReviewerText(reviewer.aiWorkflowId)
        || reviewer.isMemberReview === false
    )
}

/**
 * Normalizes challenge track values to the format expected by AI review template filters.
 */
export function normalizeTrackForAiTemplates(value: unknown): string {
    const normalizedValue = normalizeReviewerText(value)
        .toUpperCase()
        .replace(/\s+/g, '_')

    if (!normalizedValue) {
        return ''
    }

    return TEMPLATE_TRACK_ALIASES[normalizedValue] || normalizedValue
}

function normalizeWorkflowForComparison(
    workflow: AiReviewConfigWorkflow,
): string {
    const workflowId = normalizeReviewerText(workflow.workflowId)
    const weightPercent = Number(workflow.weightPercent || 0)
    const isGating = toBoolean(workflow.isGating)

    return `${workflowId}:${weightPercent}:${isGating}`
}

/**
 * Returns whether two AI review configuration snapshots differ in a way that requires persistence.
 */
export function aiReviewConfigHasChanges(
    original: AiReviewConfigurationDraft | AiReviewConfig | null | undefined,
    updated: AiReviewConfigurationDraft | AiReviewConfig | null | undefined,
): boolean {
    const originalMode = normalizeReviewerText(original?.mode)
    const updatedMode = normalizeReviewerText(updated?.mode)
    const originalThreshold = Number(original?.minPassingThreshold || 0)
    const updatedThreshold = Number(updated?.minPassingThreshold || 0)
    const originalTemplateId = normalizeReviewerText(original?.templateId)
    const updatedTemplateId = normalizeReviewerText(updated?.templateId)
    const originalAutoFinalize = toBoolean(original?.autoFinalize)
    const updatedAutoFinalize = toBoolean(updated?.autoFinalize)

    if (
        originalMode !== updatedMode
        || originalThreshold !== updatedThreshold
        || originalTemplateId !== updatedTemplateId
        || originalAutoFinalize !== updatedAutoFinalize
    ) {
        return true
    }

    const originalWorkflows = Array.isArray(original?.workflows)
        ? (original?.workflows || [])
            .map(normalizeWorkflowForComparison)
            .sort()
        : []
    const updatedWorkflows = Array.isArray(updated?.workflows)
        ? (updated?.workflows || [])
            .map(normalizeWorkflowForComparison)
            .sort()
        : []

    if (originalWorkflows.length !== updatedWorkflows.length) {
        return true
    }

    return originalWorkflows.some((workflow, index) => workflow !== updatedWorkflows[index])
}

/**
 * Validates an AI review configuration draft before create/update calls.
 */
export function validateAiReviewConfiguration(
    configuration: AiReviewConfigurationDraft,
): string[] {
    const validationErrors: string[] = []
    const challengeId = normalizeReviewerText(configuration.challengeId)
    const minPassingThreshold = toNumber(configuration.minPassingThreshold)
    const mode = normalizeReviewerText(configuration.mode)
    const workflows = Array.isArray(configuration.workflows)
        ? configuration.workflows
        : []

    if (!challengeId) {
        validationErrors.push('Challenge ID is required.')
    }

    if (minPassingThreshold === undefined || minPassingThreshold < 0 || minPassingThreshold > 100) {
        validationErrors.push('Minimum passing threshold must be between 0 and 100.')
    }

    if (mode !== 'AI_GATING' && mode !== 'AI_ONLY') {
        validationErrors.push('Review mode must be AI_GATING or AI_ONLY.')
    }

    if (!workflows.length) {
        validationErrors.push('At least one AI workflow is required.')
        return validationErrors
    }

    const invalidWorkflowCount = workflows.filter(workflow => !normalizeReviewerText(workflow.workflowId))
        .length
    if (invalidWorkflowCount > 0) {
        validationErrors.push('Select an AI workflow for each configured row.')
    }

    const totalWeight = workflows.reduce((sum, workflow) => sum + Number(workflow.weightPercent || 0), 0)
    if (Math.abs(totalWeight - 100) > 0.01) {
        validationErrors.push(`Workflow weights must total 100%. Current total: ${totalWeight.toFixed(2)}%.`)
    }

    const workflowIds = workflows
        .map(workflow => normalizeReviewerText(workflow.workflowId))
        .filter(Boolean)
    if (new Set(workflowIds).size !== workflowIds.length) {
        validationErrors.push('Each AI workflow can only be used once.')
    }

    return validationErrors
}

/**
 * Resolves the phase used for AI reviewer entries derived from AI review configs.
 */
export function getAiReviewerPhaseId(
    phases: ChallengePhase[] | undefined,
    existingAiReviewers: Reviewer[] = [],
): string | undefined {
    const existingPhaseId = existingAiReviewers
        .map(reviewer => normalizeReviewerText(reviewer.phaseId))
        .find(Boolean)
    if (existingPhaseId) {
        return existingPhaseId
    }

    const phaseRows = Array.isArray(phases)
        ? phases
        : []
    const reviewPhase = phaseRows.find(phase => {
        const phaseName = normalizeReviewerText(phase.name)
            .toLowerCase()

        return phaseName.includes('review') || phaseName.includes('screening')
    })

    return normalizeReviewerText(reviewPhase?.phaseId)
        || normalizeReviewerText(reviewPhase?.id)
        || normalizeReviewerText(phaseRows[0]?.phaseId)
        || normalizeReviewerText(phaseRows[0]?.id)
        || undefined
}

interface SyncAiConfigReviewersParams {
    availableWorkflows?: Workflow[]
    phases?: ChallengePhase[]
    reviewers?: Reviewer[]
    workflows?: AiReviewConfigWorkflow[]
}

/**
 * Reconciles challenge reviewers with the saved AI review config workflows while preserving human reviewers.
 */
export function syncAiConfigReviewers(
    params: SyncAiConfigReviewersParams,
): Reviewer[] {
    const currentReviewers = Array.isArray(params.reviewers)
        ? params.reviewers
        : []
    const humanReviewers = currentReviewers.filter(reviewer => !isAiReviewer(reviewer))
    const existingAiReviewers = currentReviewers.filter(isAiReviewer)
    const fallbackPhaseId = getAiReviewerPhaseId(params.phases, existingAiReviewers)
    const availableWorkflows = Array.isArray(params.availableWorkflows)
        ? params.availableWorkflows
        : []
    const nextAiReviewers: Reviewer[] = (Array.isArray(params.workflows)
        ? params.workflows
        : [])
        .map(workflow => {
            const workflowId = normalizeReviewerText(workflow.workflowId)

            if (!workflowId) {
                return undefined
            }

            const existingAiReviewer = existingAiReviewers.find(
                reviewer => normalizeReviewerText(reviewer.aiWorkflowId) === workflowId,
            )
            const workflowDetails = workflow.workflow || availableWorkflows.find(
                item => normalizeReviewerText(item.id) === workflowId,
            )
            const scorecardId = normalizeReviewerText(workflowDetails?.scorecardId)
                || normalizeReviewerText(workflow.workflow?.scorecard?.id)
                || normalizeReviewerText(existingAiReviewer?.scorecardId)

            return {
                ...existingAiReviewer,
                additionalMemberIds: undefined,
                aiWorkflowId: workflowId,
                handle: undefined,
                isMemberReview: false,
                memberId: undefined,
                memberReviewerCount: undefined,
                phaseId: normalizeReviewerText(existingAiReviewer?.phaseId) || fallbackPhaseId,
                resourceId: existingAiReviewer?.resourceId,
                roleId: existingAiReviewer?.roleId,
                scorecardId: scorecardId || undefined,
                shouldOpenOpportunity: false,
            } satisfies Reviewer
        })
        .filter((reviewer): reviewer is NonNullable<typeof reviewer> => !!reviewer)

    return [
        ...humanReviewers,
        ...nextAiReviewers,
    ]
}
