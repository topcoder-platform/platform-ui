import useSWR, { SWRResponse } from 'swr'

import { ProjectAttachment } from '../models'
import { fetchProjectAttachments } from '../services'

export interface UseFetchProjectAttachmentsResult {
    attachments: ProjectAttachment[]
    error: Error | undefined
    isLoading: boolean
    mutate: SWRResponse<ProjectAttachment[], Error>['mutate']
}

export function useFetchProjectAttachments(projectId: string | undefined): UseFetchProjectAttachmentsResult {
    const swrKey = projectId
        ? ['work/project-attachments', projectId]
        : undefined

    const {
        data,
        error,
        mutate,
    }: SWRResponse<ProjectAttachment[], Error>
        = useSWR<ProjectAttachment[], Error>(
            swrKey,
            () => fetchProjectAttachments(projectId as string),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        attachments: data || [],
        error,
        isLoading: !!projectId && !data && !error,
        mutate,
    }
}

export default useFetchProjectAttachments
