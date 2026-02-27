import useSWR, { SWRResponse } from 'swr'

import { SubmissionInfo } from '../models'
import { fetchSubmissions } from '../services'

export interface UseSubmissionsResult {
    isLoading: boolean
    submissions: SubmissionInfo[]
}

/**
 * Fetches submissions for a challenge.
 *
 * @param challengeId Optional challenge identifier.
 * @returns Submissions and loading status.
 */
export function useSubmissions(challengeId?: string): UseSubmissionsResult {
    const {
        data: submissions,
        isValidating: isLoading,
    }: SWRResponse<SubmissionInfo[], Error> = useSWR<SubmissionInfo[], Error>(
        `community/submissions/${challengeId}`,
        {
            fetcher: () => fetchSubmissions(challengeId ?? ''),
            isPaused: () => !challengeId,
        },
    )

    return {
        isLoading,
        submissions: submissions ?? [],
    }
}
