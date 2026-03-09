import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrPostAsync,
    xhrPutAsync,
} from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import {
    AiReviewConfig,
    AiReviewConfigWorkflow,
    AiReviewMode,
} from '../models'

const AI_REVIEW_CONFIGS_API_URL = `${EnvironmentConfig.API.V6}/ai-review/configs`

export interface SaveAiReviewConfigInput {
    autoFinalize: boolean
    challengeId: string
    formula?: Record<string, unknown>
    minPassingThreshold: number
    mode: AiReviewMode
    templateId?: string
    workflows: AiReviewConfigWorkflow[]
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

function normalizeAiReviewConfig(
    config: unknown,
): AiReviewConfig | undefined {
    if (typeof config !== 'object' || !config) {
        return undefined
    }

    const typedConfig = config as Record<string, unknown>
    const id = normalizeText(typedConfig.id)
    const challengeId = normalizeText(typedConfig.challengeId)
    const mode = normalizeText(typedConfig.mode) as AiReviewMode | undefined
    const minPassingThreshold = normalizeNumber(typedConfig.minPassingThreshold)

    if (!id || !challengeId || !mode || minPassingThreshold === undefined) {
        return undefined
    }

    return {
        autoFinalize: normalizeBoolean(typedConfig.autoFinalize) === true,
        challengeId,
        createdAt: normalizeText(typedConfig.createdAt),
        decisions: Array.isArray(typedConfig.decisions)
            ? typedConfig.decisions as Record<string, unknown>[]
            : undefined,
        formula: typeof typedConfig.formula === 'object' && typedConfig.formula
            ? typedConfig.formula as Record<string, unknown>
            : undefined,
        id,
        minPassingThreshold,
        mode,
        templateId: normalizeText(typedConfig.templateId) || undefined,
        updatedAt: normalizeText(typedConfig.updatedAt),
        version: normalizeNumber(typedConfig.version),
        workflows: Array.isArray(typedConfig.workflows)
            ? typedConfig.workflows
                .map(normalizeWorkflow)
                .filter((workflow): workflow is AiReviewConfigWorkflow => !!workflow)
            : [],
    }
}

function serializeInput(
    input: SaveAiReviewConfigInput,
): SaveAiReviewConfigInput {
    return {
        autoFinalize: input.autoFinalize === true,
        challengeId: input.challengeId.trim(),
        formula: input.formula,
        minPassingThreshold: Number(input.minPassingThreshold),
        mode: input.mode,
        templateId: input.templateId?.trim() || undefined,
        workflows: (input.workflows || [])
            .map(workflow => ({
                isGating: workflow.isGating === true,
                weightPercent: Number(workflow.weightPercent),
                workflowId: String(workflow.workflowId || '')
                    .trim(),
            }))
            .filter(workflow => !!workflow.workflowId),
    }
}

/**
 * Fetches the latest AI review configuration for a challenge.
 * Returns `undefined` when no configuration exists yet.
 */
export async function fetchAiReviewConfigByChallenge(
    challengeId: string,
): Promise<AiReviewConfig | undefined> {
    try {
        const response = await xhrGetAsync<unknown>(
            `${AI_REVIEW_CONFIGS_API_URL}/${encodeURIComponent(challengeId.trim())}`,
        )

        return normalizeAiReviewConfig(response)
    } catch (error) {
        const typedError = error as {
            response?: {
                status?: number
            }
            status?: number
        }
        const status = typedError?.status || typedError?.response?.status

        if (status === 404) {
            return undefined
        }

        throw normalizeError(error, 'Failed to fetch AI review configuration')
    }
}

/**
 * Creates a new AI review configuration for a challenge.
 */
export async function createAiReviewConfig(
    input: SaveAiReviewConfigInput,
): Promise<AiReviewConfig> {
    try {
        const response = await xhrPostAsync<SaveAiReviewConfigInput, unknown>(
            AI_REVIEW_CONFIGS_API_URL,
            serializeInput(input),
        )
        const normalizedConfig = normalizeAiReviewConfig(response)

        if (!normalizedConfig) {
            throw new Error('AI review configuration response was invalid')
        }

        return normalizedConfig
    } catch (error) {
        throw normalizeError(error, 'Failed to create AI review configuration')
    }
}

/**
 * Updates an existing AI review configuration.
 */
export async function updateAiReviewConfig(
    configId: string,
    input: SaveAiReviewConfigInput,
): Promise<AiReviewConfig> {
    try {
        const response = await xhrPutAsync<SaveAiReviewConfigInput, unknown>(
            `${AI_REVIEW_CONFIGS_API_URL}/${encodeURIComponent(configId.trim())}`,
            serializeInput(input),
        )
        const normalizedConfig = normalizeAiReviewConfig(response)

        if (!normalizedConfig) {
            throw new Error('AI review configuration response was invalid')
        }

        return normalizedConfig
    } catch (error) {
        throw normalizeError(error, 'Failed to update AI review configuration')
    }
}

/**
 * Deletes an AI review configuration.
 */
export async function deleteAiReviewConfig(
    configId: string,
): Promise<void> {
    try {
        await xhrDeleteAsync<unknown>(
            `${AI_REVIEW_CONFIGS_API_URL}/${encodeURIComponent(configId.trim())}`,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to delete AI review configuration')
    }
}
