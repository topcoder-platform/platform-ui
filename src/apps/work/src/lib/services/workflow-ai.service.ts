import {
    xhrGetAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    AI_WORKFLOW_POLL_INTERVAL_MS,
    AI_WORKFLOW_POLL_TIMEOUT_MS,
    TC_AI_API_BASE_URL,
    TC_AI_SKILLS_EXTRACTION_WORKFLOW_ID,
} from '../constants'
import {
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
    inputData: {
        jobDescription: string
    }
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
    description: string,
): Promise<void> {
    const payload: WorkflowStartPayload = {
        inputData: {
            jobDescription: description,
        },
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

async function pollWorkflowRunSkillsResult(
    workflowId: string,
    runId: string,
    startedAtMs: number,
): Promise<Skill[]> {
    if ((Date.now() - startedAtMs) > AI_WORKFLOW_POLL_TIMEOUT_MS) {
        throw new Error('Skills extraction request timed out')
    }

    const runStatus = await fetchWorkflowRunStatus(workflowId, runId)
    const status = String(runStatus.status || '')
        .trim()
        .toLowerCase()

    if (status === 'success') {
        return extractSkillsFromResult(runStatus.result)
    }

    if (status === 'failed') {
        const workflowErrorMessage = runStatus.error?.message
            ? String(runStatus.error.message)
                .trim()
            : ''

        throw new Error(workflowErrorMessage || 'Workflow execution failed')
    }

    await sleep(AI_WORKFLOW_POLL_INTERVAL_MS)

    return pollWorkflowRunSkillsResult(
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
            normalizedDescription,
        )

        return pollWorkflowRunSkillsResult(normalizedWorkflowId, runId, Date.now())
    } catch (error) {
        throw normalizeError(error, 'Failed to extract skills from description')
    }
}
