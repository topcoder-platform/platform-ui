/**
 * Download submission
 */
import { useCallback, useMemo, useState } from 'react'
import { some } from 'lodash'

import { downloadSubmissionFile } from '../services'
import { handleError } from '../utils'
import { IsRemovingType } from '../models'

export interface useDownloadSubmissionProps {
    isLoading: IsRemovingType
    isLoadingBool: boolean
    downloadSubmission: (submissionId: string) => void
}

/**
 * Download submission
 * @returns download info
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
        downloadSubmissionFile(submissionId)
            .then((data: Blob) => {
                setIsLoading(previous => ({
                    ...previous,
                    [submissionId]: false,
                }))

                const url = window.URL.createObjectURL(new Blob([data]))
                const link = document.createElement('a')
                link.href = url
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
