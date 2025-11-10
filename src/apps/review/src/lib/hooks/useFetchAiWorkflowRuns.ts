import { useEffect } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'
import { handleError } from '~/libs/shared/lib/utils/handle-error'

import { AiFeedbackItem, Scorecard } from '../models'

import { useRolePermissions, UseRolePermissionsResult } from './useRolePermissions'

export enum AiWorkflowRunStatusEnum {
    INIT = 'INIT',
    QUEUED = 'QUEUED',
    DISPATCHED = 'DISPATCHED',
    IN_PROGRESS = 'IN_PROGRESS',
    CANCELLED = 'CANCELLED',
    FAILURE = 'FAILURE',
    COMPLETED = 'COMPLETED',
    SUCCESS = 'SUCCESS',
}

export interface AiWorkflow {
    id: string;
    name: string;
    description: string;
    scorecard?: Scorecard
    defUrl: string
    llm: {
        name: string
        description: string
        icon: string
        url: string
        provider: {
            name: string
        }
    }
}

export interface AiWorkflowRun {
    id: string;
    startedAt: string;
    completedAt: string;
    status: AiWorkflowRunStatusEnum;
    score: number;
    workflow: AiWorkflow
}

export type AiWorkflowRunItem = AiFeedbackItem

const TC_API_BASE_URL = EnvironmentConfig.API.V6

export interface AiWorkflowRunsResponse {
    runs: AiWorkflowRun[]
    isLoading: boolean
}

export interface AiWorkflowRunItemsResponse {
    runItems: AiWorkflowRunItem[]
    isLoading: boolean
}

export const aiRunInProgress = (aiRun: Pick<AiWorkflowRun, 'status'>): boolean => [
    AiWorkflowRunStatusEnum.INIT,
    AiWorkflowRunStatusEnum.QUEUED,
    AiWorkflowRunStatusEnum.DISPATCHED,
    AiWorkflowRunStatusEnum.IN_PROGRESS,
].includes(aiRun.status)

export const aiRunFailed = (aiRun: Pick<AiWorkflowRun, 'status'>): boolean => [
    AiWorkflowRunStatusEnum.FAILURE,
    AiWorkflowRunStatusEnum.CANCELLED,
].includes(aiRun.status)

export function useFetchAiWorkflowsRuns(
    submissionId: string,
    workflowIds: string[],
): AiWorkflowRunsResponse {
    const { isAdmin }: UseRolePermissionsResult = useRolePermissions()

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
        runs: runs.filter(r => isAdmin || !aiRunFailed(r)),
    }
}

export function useFetchAiWorkflowsRunItems(
    workflowId: string,
    runId: string | undefined,
): AiWorkflowRunItemsResponse {
    // Use swr hooks for challenge info fetching
    const {
        data: runItems = [],
        error: fetchError,
        isValidating: isLoading,
    }: SWRResponse<AiWorkflowRunItem[], Error> = useSWR<AiWorkflowRunItem[], Error>(
        `${TC_API_BASE_URL}/workflows/${workflowId}/runs/${runId}/items`,
        {
            isPaused: () => !workflowId || !runId,
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
        runItems,
    }
}
