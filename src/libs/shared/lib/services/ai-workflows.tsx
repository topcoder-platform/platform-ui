import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync } from '~/libs/core'

// AI Workflow Configuration
const AI_WORKFLOW_POLL_INTERVAL = 2000 // 2 seconds
const AI_WORKFLOW_POLL_TIMEOUT = 120000 // 2 minutes
// Bulk ingestion fans out over every challenge matching a filter, which can
// legitimately run for far longer than a single-challenge workflow.
const AI_BULK_INGESTION_POLL_TIMEOUT = 900000 // 15 minutes
const API_BASE_URL = EnvironmentConfig.TC_AI_API || `${EnvironmentConfig.API.V6}/ai`

/**
 * Thrown when polling gives up before the run reached a terminal state.
 *
 * The run itself is still going server-side, so callers should say so rather
 * than reporting a failure. Extends Error, so existing `catch` blocks that only
 * read `.message` are unaffected.
 */
export class WorkflowPollTimeoutError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'WorkflowPollTimeoutError'
    }
}

interface WorkflowRunResponse {
    runId: string
}

interface WorkflowInputData {
    inputData: Record<string, unknown>
}

const sleep = (ms: number): Promise<void> => new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms)
})

/**
 * Start an AI workflow run
 *
 * @param workflowId - The ID of the workflow to run
 * @param inputData - The input data for the workflow, shaped to match that
 * workflow's own input schema
 * @returns The run ID
 */
async function startWorkflowRun(workflowId: string, inputData: Record<string, unknown>): Promise<string> {
    try {

        // Step 1: Create the run
        const runResponse = await xhrPostAsync<{}, WorkflowRunResponse>(
            `${API_BASE_URL}/workflows/${workflowId}/create-run`,
            {},
        )
        const runId = runResponse.runId

        if (!runId) {
            throw new Error('No runId returned from workflow creation')
        }

        // Step 2: Start the run with input
        await xhrPostAsync<WorkflowInputData, void>(
            `${API_BASE_URL}/workflows/${workflowId}/start?runId=${runId}`,
            { inputData },
        )

        return runId
    } catch (error) {
        console.error('Failed to start workflow run:', (error as Error).message)
        throw error
    }
}

interface WorkflowRunResult {
    status: 'success' | 'failed' | 'running' | 'pending'
    result?: any
    error?: { message: string }
}

/**
 * Poll for workflow run status
 *
 * @param workflowId - The ID of the workflow
 * @param runId - The ID of the run to check
 * @param maxAttempts - Maximum polling attempts
 * @returns The final run result
 */
async function pollWorkflowRunStatus(
    workflowId: string,
    runId: string,
    _maxAttempts?: number,
    _pollTimeout?: number,
): Promise<WorkflowRunResult> {
    const pollInterval = AI_WORKFLOW_POLL_INTERVAL
    const pollTimeout = _pollTimeout ?? AI_WORKFLOW_POLL_TIMEOUT
    let maxAttempts = _maxAttempts

    // Calculate max attempts based on timeout if not provided
    if (maxAttempts === undefined) {
        maxAttempts = Math.ceil(pollTimeout / pollInterval)
    }

    let attempt = 0
    const startTime = Date.now()

    while (attempt < maxAttempts) {
        try {
            // eslint-disable-next-line no-await-in-loop
            const result = await xhrGetAsync<WorkflowRunResult>(
                `${API_BASE_URL}/workflows/${workflowId}/runs/${runId}`,
            )

            const status = result?.status

            if (status === 'success') {
                return result
            }

            if (status === 'failed') {
                const errorMsg = result?.error?.message || 'Workflow execution failed'
                throw new Error(`Workflow failed: ${errorMsg}`)
            }

            const elapsed = Date.now() - startTime
            if (elapsed > pollTimeout) {
                throw new WorkflowPollTimeoutError(`Workflow polling timeout after ${elapsed}ms`)
            }

            // Wait before next poll
            // eslint-disable-next-line no-await-in-loop
            await sleep(pollInterval)
            attempt += 1
        } catch (error) {
            const errorMessage = (error as Error).message
            // If it's a network error or timeout, try again
            if (errorMessage.includes('timeout') || (error as any).code === 'ECONNABORTED') {
                const elapsed = Date.now() - startTime
                if (elapsed > pollTimeout) {
                    throw new WorkflowPollTimeoutError(`Workflow polling timeout after ${elapsed}ms`)
                }

                // eslint-disable-next-line no-await-in-loop
                await sleep(pollInterval)
                attempt += 1
            } else {
                // For other errors, re-throw immediately
                console.error('Error polling workflow status:', errorMessage)
                throw error
            }
        }
    }

    throw new WorkflowPollTimeoutError(`Workflow polling exceeded maximum attempts (${maxAttempts})`)
}

export interface SkillMatch {
    id: string
    name: string
}

export interface SkillsExtractionResult {
    matches?: SkillMatch[]
}

function parseSkillMatchesFromUnknown(payload: unknown): SkillMatch[] {
    if (!payload) {
        return []
    }

    if (typeof payload === 'string') {
        try {
            return parseSkillMatchesFromUnknown(JSON.parse(payload))
        } catch {
            return []
        }
    }

    if (Array.isArray(payload)) {
        const seenSkillIds = new Set<string>()

        return payload
            .map(item => {
                if (!item || typeof item !== 'object') {
                    return undefined
                }

                const raw = item as Record<string, unknown>
                const candidateId = raw.id ?? raw.skillId
                const candidateName = raw.name ?? raw.skillName
                const id = String(candidateId ?? '')
                    .trim()
                const name = String(candidateName ?? '')
                    .trim()

                if (!id || !name) {
                    return undefined
                }

                if (seenSkillIds.has(id)) {
                    return undefined
                }

                seenSkillIds.add(id)
                return { id, name }
            })
            .filter((item): item is SkillMatch => !!item)
    }

    if (typeof payload !== 'object') {
        return []
    }

    const raw = payload as Record<string, unknown>
    const candidates: unknown[] = [
        raw.matches,
        raw.skills,
        raw.matchesData,
        raw.items,
        raw.values,
        raw.result,
        raw.output,
        raw.outputData,
        raw.data,
    ]

    for (const candidate of candidates) {
        const parsed = parseSkillMatchesFromUnknown(candidate)
        if (parsed.length > 0) {
            return parsed
        }
    }

    return []
}

function normalizeSkillsExtractionResult(result: WorkflowRunResult): SkillsExtractionResult {
    const matches = parseSkillMatchesFromUnknown(result?.result)
    return matches.length > 0 ? { matches } : {}
}

/**
 * Extract skills from text using AI workflow
 *
 * @example
 * try {
 *   const result = await extractSkillsFromText('I have experience with JavaScript, React, and Node.js')
 *   console.log('Extracted skills:', result.matches) // {id: string; name: string}[]
 * } catch (error) {
 *   console.error('Skills extraction failed:', error.message)
 * }
 */
export async function extractSkillsFromText(
    description: string,
    workflowId?: string,
): Promise<SkillsExtractionResult> {
    if (!description || typeof description !== 'string') {
        throw new Error('Description must be a non-empty string')
    }

    const workflowIdToUse = workflowId || EnvironmentConfig.SKILLS_EXTRACTION_WORKFLOW_ID

    if (!workflowIdToUse) {
        throw new Error('AI Skills Extraction Workflow ID is not configured')
    }

    try {
        // Step 1: Start the workflow run
        console.log(`Starting workflow run for: ${workflowIdToUse}`)
        const runId = await startWorkflowRun(workflowIdToUse, { jobDescription: description })
        console.log(`Workflow started with runId: ${runId}`)

        // Step 2: Poll for completion
        console.log('Polling for workflow completion...')
        const result = await pollWorkflowRunStatus(workflowIdToUse, runId)
        console.log('Workflow completed successfully')

        return normalizeSkillsExtractionResult(result)
    } catch (error) {
        console.error('Skills extraction workflow failed:', (error as Error).message)
        throw error
    }
}

export interface ChallengeIngestionResult {
    chunks: number
    dryRun: boolean
    skipped: boolean
    projectId: string | undefined
}

function normalizeChallengeIngestionResult(result: WorkflowRunResult): ChallengeIngestionResult {
    const raw = (result?.result ?? {}) as Record<string, unknown>

    return {
        chunks: typeof raw.chunks === 'number' ? raw.chunks : 0,
        dryRun: Boolean(raw.dryRun),
        projectId: typeof raw.projectId === 'string' ? raw.projectId : undefined,
        skipped: Boolean(raw.skipped),
    }
}

export interface ChallengeIngestionOptions {
    /**
     * Chunk and embed the challenge but skip the vector upsert, so the index is
     * left untouched. Honoured by the challenge-ingestion workflow itself (its
     * upsert-vectors step is skipped) and echoed back on the report.
     */
    dryRun?: boolean
    workflowId?: string
}

/**
 * Ingest a single challenge into the RAG vector index using AI workflow
 *
 * @example
 * try {
 *   const report = await ingestChallengeInRag('a1b2c3d4-...')
 *   console.log('Ingested chunks:', report.chunks)
 *
 *   // Preview without writing to the index
 *   const preview = await ingestChallengeInRag('a1b2c3d4-...', { dryRun: true })
 * } catch (error) {
 *   console.error('Challenge ingestion failed:', error.message)
 * }
 */
export async function ingestChallengeInRag(
    challengeId: string,
    options: ChallengeIngestionOptions = {},
): Promise<ChallengeIngestionResult> {
    if (!challengeId || typeof challengeId !== 'string') {
        throw new Error('Challenge id must be a non-empty string')
    }

    const workflowIdToUse = options.workflowId || EnvironmentConfig.RAG_CHALLENGE_INGESTION_WORKFLOW_ID

    if (!workflowIdToUse) {
        throw new Error('RAG Challenge Ingestion Workflow ID is not configured')
    }

    try {
        console.log(`Starting workflow run for: ${workflowIdToUse}`)
        const runId = await startWorkflowRun(workflowIdToUse, {
            challengeId,
            dryRun: !!options.dryRun,
        })
        console.log(`Workflow started with runId: ${runId}`)

        console.log('Polling for workflow completion...')
        const result = await pollWorkflowRunStatus(workflowIdToUse, runId)
        console.log('Workflow completed successfully')

        return normalizeChallengeIngestionResult(result)
    } catch (error) {
        console.error('Challenge RAG ingestion workflow failed:', (error as Error).message)
        throw error
    }
}

export interface BulkIngestionFilters {
    projectId?: string
    /** Challenge statuses; defaults server-side to ACTIVE + COMPLETED. */
    status?: string[]
    types?: string[]
    tracks?: string[]
    /** ISO date (YYYY-MM-DD) — only ingest challenges updated on or after this. */
    updatedDateStart?: string
    dryRun?: boolean
    concurrency?: number
}

export interface BulkIngestionFailure {
    challengeId: string
    name: string
    error: string
}

export interface BulkIngestionResult {
    processed: number
    succeeded: number
    failed: number
    skipped: number
    chunks: number
    dryRun: boolean
    failures: BulkIngestionFailure[]
}

function toNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/**
 * The bulk workflow's aggregate report isn't typed at this boundary, so read it
 * defensively — same approach as normalizeChallengeIngestionResult above. A
 * missing counter reads as 0 rather than rendering "undefined" to an operator.
 */
function normalizeBulkIngestionResult(result: WorkflowRunResult): BulkIngestionResult {
    const raw = (result?.result ?? {}) as Record<string, unknown>
    const perChallenge = Array.isArray(raw.results) ? raw.results : []

    const failures: BulkIngestionFailure[] = perChallenge
        .filter((entry): entry is Record<string, unknown> => (
            !!entry && typeof entry === 'object' && (entry as Record<string, unknown>).status === 'failed'
        ))
        .map(entry => ({
            challengeId: String(entry.challengeId ?? ''),
            error: String(entry.error ?? 'Unknown error'),
            name: String(entry.name ?? ''),
        }))

    return {
        chunks: toNumber(raw.totalChunks),
        dryRun: Boolean(raw.dryRun),
        failed: toNumber(raw.failed),
        failures,
        processed: toNumber(raw.processed),
        skipped: toNumber(raw.skipped),
        succeeded: toNumber(raw.succeeded),
    }
}

/**
 * Run a filtered bulk ingestion into the RAG vector index.
 *
 * Every filter is optional — with none set, the workflow ingests every
 * challenge in its default status set, so callers should require at least one
 * deliberate choice from the operator.
 *
 * Throws WorkflowPollTimeoutError if the run outlives the poll window; the run
 * continues server-side, so that is "still running", not "failed".
 */
export async function bulkIngestChallengesInRag(
    filters: BulkIngestionFilters,
    workflowId?: string,
): Promise<BulkIngestionResult> {
    const workflowIdToUse = workflowId || EnvironmentConfig.RAG_CHALLENGE_BULK_INGESTION_WORKFLOW_ID

    if (!workflowIdToUse) {
        throw new Error('RAG Challenge Bulk Ingestion Workflow ID is not configured')
    }

    // Only send filters the operator actually set: the workflow applies its own
    // defaults (e.g. the status set), which an explicit undefined would not.
    const inputData: Record<string, unknown> = {}
    Object.entries(filters)
        .forEach(([key, value]) => {
            const isEmptyArray = Array.isArray(value) && value.length === 0
            if (value !== undefined && value !== '' && !isEmptyArray) {
                inputData[key] = value
            }
        })

    const runId = await startWorkflowRun(workflowIdToUse, inputData)
    const result = await pollWorkflowRunStatus(
        workflowIdToUse,
        runId,
        undefined,
        AI_BULK_INGESTION_POLL_TIMEOUT,
    )

    return normalizeBulkIngestionResult(result)
}
