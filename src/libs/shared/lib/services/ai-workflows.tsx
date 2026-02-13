import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync } from '~/libs/core'

// AI Workflow Configuration
const AI_WORKFLOW_POLL_INTERVAL = 2000 // 2 seconds
const AI_WORKFLOW_POLL_TIMEOUT = 120000 // 2 minutes
const API_BASE_URL = EnvironmentConfig.TC_AI_API || `${EnvironmentConfig.API.V6}/ai`

interface WorkflowRunResponse {
    runId: string
}

interface WorkflowInputData {
    inputData: { jobDescription: string }
}

const sleep = (ms: number): Promise<void> => new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms)
})

/**
 * Start an AI workflow run
 *
 * @param workflowId - The ID of the workflow to run
 * @param input - The input data for the workflow
 * @returns The run ID
 */
async function startWorkflowRun(workflowId: string, input: string): Promise<string> {
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
            { inputData: { jobDescription: input } },
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
): Promise<WorkflowRunResult> {
    const pollInterval = AI_WORKFLOW_POLL_INTERVAL
    const pollTimeout = AI_WORKFLOW_POLL_TIMEOUT
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
                throw new Error(`Workflow polling timeout after ${elapsed}ms`)
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
                    throw new Error(`Workflow polling timeout after ${elapsed}ms`)
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

    throw new Error(`Workflow polling exceeded maximum attempts (${maxAttempts})`)
}

export interface SkillMatch {
    id: string
    name: string
}

export interface SkillsExtractionResult {
    matches?: SkillMatch[]
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
        const runId = await startWorkflowRun(workflowIdToUse, description)
        console.log(`Workflow started with runId: ${runId}`)

        // Step 2: Poll for completion
        console.log('Polling for workflow completion...')
        const result = await pollWorkflowRunStatus(workflowIdToUse, runId)
        console.log('Workflow completed successfully')

        return (result.result as SkillsExtractionResult) || {}
    } catch (error) {
        console.error('Skills extraction workflow failed:', (error as Error).message)
        throw error
    }
}
