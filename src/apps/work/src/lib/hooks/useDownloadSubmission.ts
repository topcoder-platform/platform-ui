import {
    useCallback,
    useMemo,
    useState,
} from 'react'

import { downloadSubmission as downloadSubmissionService } from '../services'
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

function downloadBlob(blob: Blob, fileName: string): void {
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = blobUrl
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
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
            const blob = await downloadSubmissionService(normalizedSubmissionId)

            downloadBlob(blob, `submission-${normalizedSubmissionId}.zip`)
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
