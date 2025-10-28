import { useEffect } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'
import { handleError } from '~/libs/shared/lib/utils/handle-error'

export interface AiWorkflowRun {
    id: string;
    completedAt: string;
    status: string;
    score: number;
    workflow: {
        name: string;
        description: string;
        scorecard: {
            name: string;
            minimumPassingScore: number;
        }
    }
}

const TC_API_BASE_URL = EnvironmentConfig.API.V6

export interface AiWorkflowRunsResponse {
    runs: AiWorkflowRun[]
    isLoading: boolean
}

export function useFetchAiWorkflowRuns(
    workflowId: string,
    submissionId: string,
): AiWorkflowRunsResponse {
    // Use swr hooks for challenge info fetching
    const {
        data: runs = [],
        error: fetchError,
        isValidating: isLoading,
    }: SWRResponse<AiWorkflowRun[], Error> = useSWR<AiWorkflowRun[], Error>(
        `${TC_API_BASE_URL}/workflows/${workflowId}/runs?submissionId=${submissionId}`,
        {
            isPaused: () => !workflowId || !submissionId,
        },
    )

    // Show backend error when fetching challenge info
    useEffect(() => {
        if (fetchError) {
            handleError(fetchError)
        }
    }, [fetchError])

    return {
        isLoading,
        runs,
    }
}

export function useFetchAiWorkflowsRuns(
    submissionId: string,
    workflowIds: string[],
): AiWorkflowRunsResponse {
    // Use swr hooks for challenge info fetching
    const {
        data: runs = [],
        error: fetchError,
        isValidating: isLoading,
    }: SWRResponse<AiWorkflowRun[], Error> = useSWR<AiWorkflowRun[], Error>(
        `${TC_API_BASE_URL}/workflows/${workflowIds.join(',')}/runs?submissionId=${submissionId}`,
        {
            fetcher: () => Promise.all(
                workflowIds.map(workflowId => (
                    xhrGetAsync<AiWorkflowRun>(
                        `${TC_API_BASE_URL}/workflows/${workflowId}/runs?submissionId=${submissionId}`,
                    )
                )),
            )
                .then(results => results.flat()),
            isPaused: () => !workflowIds?.length || !submissionId,
        },
    )

    // Show backend error when fetching challenge info
    useEffect(() => {
        if (fetchError) {
            handleError(fetchError)
        }
    }, [fetchError])

    return {
        isLoading,
        runs,
    }
}
