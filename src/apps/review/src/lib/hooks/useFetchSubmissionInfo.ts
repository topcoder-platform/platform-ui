import { useEffect } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/libs/shared'

import { BackendSubmission } from '../models'
import { fetchSubmission } from '../services'

export const useFetchSubmissionInfo = (submissionId?: string): [
    BackendSubmission | undefined,
    boolean
] => {
    // Use swr hooks for submission info fetching
    const {
        data: submissionInfo,
        error: fetchSubmissionError,
        isValidating: isLoadingSubmission,
    }: SWRResponse<BackendSubmission, Error> = useSWR<BackendSubmission, Error>(
        `/submissions/${submissionId}`,
        {
            fetcher: () => fetchSubmission(submissionId as string),
            isPaused: () => !submissionId,
        },
    )

    // Show backend error when fetching submission info
    useEffect(() => {
        if (fetchSubmissionError) {
            handleError(fetchSubmissionError)
        }
    }, [fetchSubmissionError])

    return [submissionInfo, isLoadingSubmission]
}
