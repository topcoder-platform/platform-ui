import useSWR, { SWRResponse } from 'swr'

import { MarathonMatchRunnerLogs } from '../models'
import { fetchSubmissionRunnerLogs } from '../services'

export interface UseFetchSubmissionRunnerLogsResult {
    error: Error | undefined
    isError: boolean
    isLoading: boolean
    runnerLogs: MarathonMatchRunnerLogs | undefined
}

/**
 * Fetches marathon match ECS runner logs for a submission while a modal is open.
 * @param submissionId Submission identifier to load logs for.
 * @returns Loading, error, and runner-log response state for the caller.
 * @throws Does not throw; request failures are exposed through `error` and `isError`.
 * Used by `SubmissionRunnerLogsModal` to retrieve CloudWatch events on demand.
 */
export function useFetchSubmissionRunnerLogs(
    submissionId?: string,
): UseFetchSubmissionRunnerLogsResult {
    const swrKey = submissionId
        ? [
            'submission-runner-logs',
            submissionId,
        ]
        : undefined

    const {
        data,
        error,
    }: SWRResponse<MarathonMatchRunnerLogs, Error>
        = useSWR<MarathonMatchRunnerLogs, Error>(
            swrKey,
            () => fetchSubmissionRunnerLogs(submissionId as string),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        isError: !!error,
        isLoading: !!submissionId && !data && !error,
        runnerLogs: data,
    }
}

export default useFetchSubmissionRunnerLogs
