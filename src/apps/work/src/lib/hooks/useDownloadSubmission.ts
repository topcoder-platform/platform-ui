import {
    useCallback,
    useMemo,
    useState,
} from 'react'

import { getSubmissionDownloadUrl } from '../services'
import { showErrorToast } from '../utils'

export interface UseDownloadSubmissionResult {
    downloadSubmission: (submissionId: string) => Promise<void>
    isLoading: Record<string, boolean>
    isLoadingBool: boolean
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return 'Failed to download submission'
}

/**
 * Starts a browser-managed download from a signed storage URL.
 *
 * @param downloadUrl The short-lived URL returned by the Review API.
 * @param fileName The preferred local filename when the browser honors the download attribute.
 * @returns Nothing.
 * @throws Never directly; the browser owns the resulting navigation and download.
 */
function startDownload(downloadUrl: string, fileName: string): void {
    const link = document.createElement('a')

    link.href = downloadUrl
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
}

export function useDownloadSubmission(): UseDownloadSubmissionResult {
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})

    const isLoadingBool = useMemo(
        () => Object.values(isLoading)
            .some(value => value === true),
        [isLoading],
    )

    const downloadSubmission = useCallback(async (submissionId: string): Promise<void> => {
        const normalizedSubmissionId = submissionId.trim()
        if (!normalizedSubmissionId) {
            return
        }

        setIsLoading(previousState => ({
            ...previousState,
            [normalizedSubmissionId]: true,
        }))

        try {
            const downloadUrlValue = await getSubmissionDownloadUrl(normalizedSubmissionId)

            startDownload(downloadUrlValue, `submission-${normalizedSubmissionId}.zip`)
        } catch (error) {
            showErrorToast(getErrorMessage(error))
        } finally {
            setIsLoading(previousState => ({
                ...previousState,
                [normalizedSubmissionId]: false,
            }))
        }
    }, [])

    return {
        downloadSubmission,
        isLoading,
        isLoadingBool,
    }
}

export default useDownloadSubmission
