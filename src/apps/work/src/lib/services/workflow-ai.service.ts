import {
    xhrGetAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    AI_WORKFLOW_POLL_INTERVAL_MS,
    AI_WORKFLOW_POLL_TIMEOUT_MS,
    TC_AI_API_BASE_URL,
    TC_AI_AUTOWRITE_WORKFLOW_ID,
    TC_AI_CONTEXT_WORKFLOW_ID,
    TC_AI_SKILLS_EXTRACTION_WORKFLOW_ID,
} from '../constants'
import {
    ChallengeReviewContextData,
    Skill,
} from '../models'

interface WorkflowRunCreateResponse {
    runId?: string
}

interface WorkflowRunError {
    message?: string
}

interface WorkflowRunStatusResponse {
    error?: WorkflowRunError
    result?: unknown
    status?: string
}

interface WorkflowStartPayload {
    inputData: Record<string, string>
}

interface SkillsExtractionResult {
    matches?: unknown[]
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

    const message = typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage

    return new Error(message)
}

function sleep(durationMs: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, durationMs)
    })
}

function normalizeSkill(value: unknown): Skill | undefined {
    if (!value || typeof value !== 'object') {
        return undefined
    }

    const typedValue = value as {
        id?: unknown
        name?: unknown
    }

    const id = String(typedValue.id || '')
        .trim()
    const name = String(typedValue.name || '')
        .trim()

    if (!id || !name) {
        return undefined
    }

    return {
        id,
        name,
    }
}

function extractSkillsFromResult(value: unknown): Skill[] {
    if (!value || typeof value !== 'object') {
        return []
    }

    const typedResult = value as SkillsExtractionResult

    if (!Array.isArray(typedResult.matches)) {
        return []
    }

    const addedSkillIds = new Set<string>()

    return typedResult.matches
        .map(skill => normalizeSkill(skill))
        .filter((skill): skill is Skill => {
            if (!skill) {
                return false
            }

            if (addedSkillIds.has(skill.id)) {
                return false
            }

            addedSkillIds.add(skill.id)
            return true
        })
}

function getWorkflowBaseUrl(workflowId: string): string {
    return `${TC_AI_API_BASE_URL}/workflows/${encodeURIComponent(workflowId)}`
}

async function createWorkflowRun(workflowId: string): Promise<string> {
    const response = await xhrPostAsync<Record<string, never>, WorkflowRunCreateResponse>(
        `${getWorkflowBaseUrl(workflowId)}/create-run`,
        {},
    )

    const runId = String(response?.runId || '')
        .trim()

    if (!runId) {
        throw new Error('No runId returned from workflow creation')
    }

    return runId
}

async function startWorkflowRun(
    workflowId: string,
    runId: string,
    payloadData: any,
): Promise<void> {
    const payload: WorkflowStartPayload = {
        inputData: payloadData,
    }

    await xhrPostAsync<WorkflowStartPayload, unknown>(
        `${getWorkflowBaseUrl(workflowId)}/start?runId=${encodeURIComponent(runId)}`,
        payload,
    )
}

async function fetchWorkflowRunStatus(
    workflowId: string,
    runId: string,
): Promise<WorkflowRunStatusResponse> {
    return xhrGetAsync<WorkflowRunStatusResponse>(
        `${getWorkflowBaseUrl(workflowId)}/runs/${encodeURIComponent(runId)}`,
    )
}

/**
 * Polls an AI workflow run until it completes or times out.
 *
 * @param workflowId - Workflow identifier for the run being checked.
 * @param runId - Run identifier returned from workflow creation.
 * @param startedAtMs - Epoch time used to enforce the polling timeout.
 * @returns The raw workflow result payload when the run succeeds.
 * @throws Error when the workflow fails or the polling window expires.
 */
async function pollWorkflowRunResult(
    workflowId: string,
    runId: string,
    startedAtMs: number,
): Promise<unknown> {
    if ((Date.now() - startedAtMs) > AI_WORKFLOW_POLL_TIMEOUT_MS) {
        throw new Error('Workflow request timed out')
    }

    let runStatus: WorkflowRunStatusResponse
    try {
        runStatus = await fetchWorkflowRunStatus(workflowId, runId)
    } catch {
        runStatus = {}
    }

    const status = String(runStatus.status || '')
        .trim()
        .toLowerCase()

    if (status === 'success') {
        return runStatus.result
    }

    if (status === 'failed') {
        const workflowErrorMessage = runStatus.error?.message
            ? String(runStatus.error.message)
                .trim()
            : ''

        throw new Error(workflowErrorMessage || 'Workflow execution failed')
    }

    await sleep(AI_WORKFLOW_POLL_INTERVAL_MS)

    return pollWorkflowRunResult(
        workflowId,
        runId,
        startedAtMs,
    )
}

export async function extractSkillsFromText(
    description: string,
    workflowId?: string,
): Promise<Skill[]> {
    const normalizedDescription = description.trim()

    if (!normalizedDescription) {
        throw new Error('Description must be a non-empty string')
    }

    const normalizedWorkflowId = String(
        workflowId || TC_AI_SKILLS_EXTRACTION_WORKFLOW_ID,
    )
        .trim()

    if (!normalizedWorkflowId) {
        throw new Error('Workflow ID is required to extract skills')
    }

    try {
        const runId = await createWorkflowRun(normalizedWorkflowId)

        await startWorkflowRun(
            normalizedWorkflowId,
            runId,
            { jobDescription: normalizedDescription },
        )

        const result = await pollWorkflowRunResult(normalizedWorkflowId, runId, Date.now())

        return extractSkillsFromResult(result)
    } catch (error) {
        throw normalizeError(error, 'Failed to extract skills from description')
    }
}

function parseWorkflowResultToObject(value: unknown): ChallengeReviewContextData {
    if (typeof value === 'string') {
        const trimmed = value.trim()

        if (!trimmed) {
            throw new Error('Workflow result did not contain any data')
        }

        try {
            const parsed = JSON.parse(trimmed)

            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                throw new Error('Workflow result JSON must be an object')
            }

            return parsed as ChallengeReviewContextData
        } catch {
            throw new Error('Workflow result was not valid JSON')
        }
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Workflow result must be an object')
    }

    const resultObject = value as Record<string, unknown>

    const candidateContext = resultObject.context
    const candidateResult = resultObject.result
    const candidateOutput = resultObject.output
    const candidateData = resultObject.data

    const preferredContext = [candidateContext, candidateResult, candidateOutput, candidateData]
        .find(item => item && typeof item === 'object' && !Array.isArray(item)) as Record<string, unknown> | undefined

    return (preferredContext || resultObject) as ChallengeReviewContextData
}

export async function generateChallengeReviewContext(
    challengeId: string,
    workflowId?: string,
): Promise<ChallengeReviewContextData> {
    const normalizedWorkflowId = String(
        workflowId || TC_AI_CONTEXT_WORKFLOW_ID,
    )
        .trim()

    if (!normalizedWorkflowId) {
        throw new Error('Workflow ID is required to generate review context')
    }

    try {
        const runId = await createWorkflowRun(normalizedWorkflowId)

        await startWorkflowRun(
            normalizedWorkflowId,
            runId,
            {
                challengeId,
            },
        )

        const result = await pollWorkflowRunResult(normalizedWorkflowId, runId, Date.now())

        return parseWorkflowResultToObject(result)
    } catch (error) {
        throw normalizeError(error, 'Failed to generate review context')
    }
}

/**
 * Rewrites an engagement description with the AI autowrite workflow.
 *
 * @param description - Existing engagement description to improve.
 * @param workflowId - Optional workflow ID override for non-default environments.
 * @returns The formatted description returned by the workflow.
 * @throws Error when the description is empty, the workflow is not configured, or no formatted
 * description is returned by the workflow result.
 */
export async function autowriteDescription(
    description: string,
    workflowId?: string,
): Promise<string> {
    const normalizedDescription = description.trim()

    if (!normalizedDescription) {
        throw new Error('Description must be a non-empty string')
    }

    const normalizedWorkflowId = String(
        workflowId || TC_AI_AUTOWRITE_WORKFLOW_ID,
    )
        .trim()

    if (!normalizedWorkflowId) {
        throw new Error('Workflow ID is required to autowrite description')
    }

    try {
        const runId = await createWorkflowRun(normalizedWorkflowId)

        await startWorkflowRun(
            normalizedWorkflowId,
            runId,
            { rawDescription: normalizedDescription },
        )

        const result = await pollWorkflowRunResult(normalizedWorkflowId, runId, Date.now())
        const formattedDescription = typeof result === 'object' && result
            ? String((result as { formattedDescription?: unknown }).formattedDescription || '')
                .trim()
            : ''

        if (!formattedDescription) {
            throw new Error('No formatted description returned')
        }

        return formattedDescription
    } catch (error) {
        throw normalizeError(error, 'Failed to generate description')
    }
}
