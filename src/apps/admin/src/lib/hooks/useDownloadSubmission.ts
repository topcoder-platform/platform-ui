/**
 * Download submission
 */
import { useCallback, useMemo, useState } from 'react'
import { some } from 'lodash'

import { getSubmissionDownloadUrl } from '../services'
import { handleError } from '../utils'
import { IsRemovingType } from '../models'

export interface useDownloadSubmissionProps {
    isLoading: IsRemovingType
    isLoadingBool: boolean
    downloadSubmission: (submissionId: string) => void
}

/**
 * Requests signed submission URLs and starts browser-managed downloads.
 *
 * @returns The download callback and its per-submission loading state.
 */
export function useDownloadSubmission(): useDownloadSubmissionProps {
    const [isLoading, setIsLoading] = useState<IsRemovingType>({})
    const isLoadingBool = useMemo(
        () => some(isLoading, value => value === true),
        [isLoading],
    )

    const downloadSubmission = useCallback((submissionId: string) => {
        setIsLoading(previous => ({
            ...previous,
            [submissionId]: true,
        }))
        getSubmissionDownloadUrl(submissionId)
            .then((downloadUrl: string) => {
                setIsLoading(previous => ({
                    ...previous,
                    [submissionId]: false,
                }))

                const link = document.createElement('a')
                link.href = downloadUrl
                link.setAttribute('download', `submission-${submissionId}.zip`)
                document.body.appendChild(link)
                link.click()
                link.parentNode?.removeChild(link)
            })
            .catch(e => {
                setIsLoading(previous => ({
                    ...previous,
                    [submissionId]: false,
                }))
                handleError(e)
            })
    }, [])

    return {
        downloadSubmission,
        isLoading,
        isLoadingBool,
    }
}
