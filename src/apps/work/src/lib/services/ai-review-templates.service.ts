import { xhrGetAsync } from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import {
    AiReviewConfigWorkflow,
    AiReviewMode,
    AiReviewTemplate,
} from '../models'

const AI_REVIEW_TEMPLATES_API_URL = `${EnvironmentConfig.API.V6}/ai-review/templates`

export interface FetchAiReviewTemplatesFilters {
    challengeTrack?: string
    challengeType?: string
}

function normalizeText(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

function normalizeNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined
    }

    const parsedValue = Number(value)

    return Number.isFinite(parsedValue)
        ? parsedValue
        : undefined
}

function normalizeBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
        return value
    }

    return undefined
}

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        message?: string
        response?: {
            data?: {
                message?: string
            }
        }
    }

    return new Error(
        typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage,
    )
}

function normalizeWorkflow(
    workflow: unknown,
): AiReviewConfigWorkflow | undefined {
    if (typeof workflow !== 'object' || !workflow) {
        return undefined
    }

    const typedWorkflow = workflow as Record<string, unknown>
    const workflowId = normalizeText(typedWorkflow.workflowId)
    const weightPercent = normalizeNumber(typedWorkflow.weightPercent)

    if (!workflowId || weightPercent === undefined) {
        return undefined
    }

    const typedWorkflowDetails = typeof typedWorkflow.workflow === 'object' && typedWorkflow.workflow
        ? typedWorkflow.workflow as Record<string, unknown>
        : undefined
    const typedScorecard = typedWorkflowDetails
        && typeof typedWorkflowDetails.scorecard === 'object'
        && typedWorkflowDetails.scorecard
        ? typedWorkflowDetails.scorecard as Record<string, unknown>
        : undefined

    return {
        id: normalizeText(typedWorkflow.id),
        isGating: normalizeBoolean(typedWorkflow.isGating) === true,
        weightPercent,
        workflow: typedWorkflowDetails
            ? {
                id: normalizeText(typedWorkflowDetails.id),
                name: normalizeText(typedWorkflowDetails.name),
                scorecard: typedScorecard
                    ? {
                        id: normalizeText(typedScorecard.id),
                        name: normalizeText(typedScorecard.name),
                    }
                    : undefined,
                scorecardId: normalizeText(typedWorkflowDetails.scorecardId),
            }
            : undefined,
        workflowId,
    }
}

function normalizeTemplate(
    template: unknown,
): AiReviewTemplate | undefined {
    if (typeof template !== 'object' || !template) {
        return undefined
    }

    const typedTemplate = template as Record<string, unknown>
    const id = normalizeText(typedTemplate.id)
    const title = normalizeText(typedTemplate.title)
    const challengeTrack = normalizeText(typedTemplate.challengeTrack)
    const challengeType = normalizeText(typedTemplate.challengeType)
    const mode = normalizeText(typedTemplate.mode) as AiReviewMode | undefined
    const minPassingThreshold = normalizeNumber(typedTemplate.minPassingThreshold)

    if (!id || !title || !challengeTrack || !challengeType || !mode || minPassingThreshold === undefined) {
        return undefined
    }

    return {
        autoFinalize: normalizeBoolean(typedTemplate.autoFinalize) === true,
        challengeTrack,
        challengeType,
        createdAt: normalizeText(typedTemplate.createdAt),
        description: normalizeText(typedTemplate.description) || '',
        formula: typeof typedTemplate.formula === 'object' && typedTemplate.formula
            ? typedTemplate.formula as Record<string, unknown>
            : undefined,
        id,
        minPassingThreshold,
        mode,
        title,
        updatedAt: normalizeText(typedTemplate.updatedAt),
        version: normalizeNumber(typedTemplate.version),
        workflows: Array.isArray(typedTemplate.workflows)
            ? typedTemplate.workflows
                .map(normalizeWorkflow)
                .filter((workflow): workflow is AiReviewConfigWorkflow => !!workflow)
            : [],
    }
}

function normalizeTemplatesResponse(response: unknown): AiReviewTemplate[] {
    if (Array.isArray(response)) {
        return response
            .map(normalizeTemplate)
            .filter((template): template is AiReviewTemplate => !!template)
    }

    if (typeof response === 'object' && response) {
        const typedResponse = response as {
            data?: unknown
            result?: unknown
        }

        if (Array.isArray(typedResponse.data)) {
            return typedResponse.data
                .map(normalizeTemplate)
                .filter((template): template is AiReviewTemplate => !!template)
        }

        if (Array.isArray(typedResponse.result)) {
            return typedResponse.result
                .map(normalizeTemplate)
                .filter((template): template is AiReviewTemplate => !!template)
        }
    }

    return []
}

/**
 * Fetches AI review templates for the supplied challenge track and type.
 */
export async function fetchAiReviewTemplates(
    filters: FetchAiReviewTemplatesFilters = {},
): Promise<AiReviewTemplate[]> {
    const query = new URLSearchParams()

    if (filters.challengeTrack?.trim()) {
        query.set('challengeTrack', filters.challengeTrack.trim())
    }

    if (filters.challengeType?.trim()) {
        query.set('challengeType', filters.challengeType.trim())
    }

    try {
        const queryString = query.toString()
        const response = await xhrGetAsync<unknown>(
            queryString
                ? `${AI_REVIEW_TEMPLATES_API_URL}?${queryString}`
                : AI_REVIEW_TEMPLATES_API_URL,
        )

        return normalizeTemplatesResponse(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch AI review templates')
    }
}
