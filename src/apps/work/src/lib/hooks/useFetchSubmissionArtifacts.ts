import useSWR, { SWRResponse } from 'swr'

import { fetchSubmissionArtifacts } from '../services'

export interface UseFetchSubmissionArtifactsResult {
    artifacts: string[]
    error: Error | undefined
    isError: boolean
    isLoading: boolean
}

export function useFetchSubmissionArtifacts(
    submissionId?: string,
): UseFetchSubmissionArtifactsResult {
    const swrKey = submissionId
        ? [
            'submission-artifacts',
            submissionId,
        ]
        : undefined

    const {
        data,
        error,
    }: SWRResponse<string[], Error> = useSWR<string[], Error>(
        swrKey,
        () => fetchSubmissionArtifacts(submissionId as string),
        {
            errorRetryCount: 2,
            shouldRetryOnError: true,
        },
    )

    return {
        artifacts: data || [],
        error,
        isError: !!error,
        isLoading: !!submissionId && !data && !error,
    }
}

export default useFetchSubmissionArtifacts
