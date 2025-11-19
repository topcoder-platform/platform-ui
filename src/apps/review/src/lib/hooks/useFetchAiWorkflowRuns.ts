import { useCallback, useEffect, useState } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrGetBlobAsync } from '~/libs/core'
import { handleError } from '~/libs/shared/lib/utils/handle-error'

import { AiFeedbackItem, Scorecard } from '../models'

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
    gitRunId?: string;
    gitRunUrl?: string;
    score: number;
    workflow: AiWorkflow
    usage: {
        input: number
        output: number
    }
}

export interface AiWorkflowRunArtifact {
    id: number
    name: string
    size_in_bytes: number
    url: string
    archive_download_url: string
    expired: boolean
    workflow_run: {
        id: number
        repository_id: number
        head_sha: string
    }
    created_at: string
    updated_at: string
    expires_at: string
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

export interface AiWorkflowRunAttachmentsApiResponse {
    artifacts: AiWorkflowRunArtifact[]
    total_count: number
}

export interface AiWorkflowRunAttachmentsResponse {
    artifacts: AiWorkflowRunArtifact[]
    totalCount: number
    isLoading: boolean
}

export interface AiWorkflowRunArtifactDownloadResponse {
    download: (artifactId: number) => Promise<void>
    isDownloading: boolean
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

export function useFetchAiWorkflowsRunItems(
    workflowId: string | undefined,
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

export function useFetchAiWorkflowsRunAttachments(
    workflowId?: string,
    runId?: string | undefined,
): AiWorkflowRunAttachmentsResponse {
    const {
        data,
        error: fetchError,
        isValidating: isLoading,
    }: SWRResponse<AiWorkflowRunAttachmentsApiResponse, Error> = useSWR<
        AiWorkflowRunAttachmentsApiResponse,
        Error
    >(
        `${TC_API_BASE_URL}/workflows/${workflowId}/runs/${runId}/attachments`,
        {
            isPaused: () => !workflowId || !runId,
        },
    )

    useEffect(() => {
        if (fetchError) {
            handleError(fetchError)
        }
    }, [fetchError])

    return {
        artifacts: data?.artifacts ?? [],
        isLoading,
        totalCount: data?.total_count ?? 0,
    }
}

export function useDownloadAiWorkflowsRunArtifact(
    workflowId?: string,
    runId?: string,
): AiWorkflowRunArtifactDownloadResponse {
    const [isDownloading, setIsDownloading] = useState(false)

    const download = useCallback(
        async (artifactId: number): Promise<void> => {
            if (!workflowId || !runId || !artifactId) return

            setIsDownloading(true)
            const url = `${TC_API_BASE_URL}/workflows/${workflowId}/runs/${runId}/attachments/${artifactId}/zip`

            try {
                const blob = await xhrGetBlobAsync<Blob>(url)

                const objectUrl = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = objectUrl
                link.download = `artifact-${artifactId}.zip`

                document.body.appendChild(link)
                link.click()
                link.remove()

                window.URL.revokeObjectURL(objectUrl)
            } catch (err) {
                handleError(err as Error)
            } finally {
                setIsDownloading(false)
            }
        },
        [workflowId, runId],
    )

    return {
        download,
        isDownloading,
    }
}
