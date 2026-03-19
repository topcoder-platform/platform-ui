import {
    useCallback,
    useState,
} from 'react'

import { downloadSubmission } from '../services'
import {
    showErrorToast,
    showInfoToast,
    showSuccessToast,
} from '../utils'

export interface DownloadAllSubmissionItem {
    id: string
    legacySubmissionId?: string
}

export interface UseDownloadAllSubmissionsResult {
    downloadAll: (submissions: DownloadAllSubmissionItem[]) => Promise<void>
    isDownloading: boolean
    progress: number
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return 'Failed to download one or more submissions'
}

function getFileName(submission: DownloadAllSubmissionItem): string {
    const fileName = submission.legacySubmissionId || submission.id

    return `${fileName}.zip`
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

export function useDownloadAllSubmissions(): UseDownloadAllSubmissionsResult {
    const [isDownloading, setIsDownloading] = useState<boolean>(false)
    const [progress, setProgress] = useState<number>(0)

    const downloadAll = useCallback(async (submissions: DownloadAllSubmissionItem[]): Promise<void> => {
        if (!submissions.length) {
            showInfoToast('No submissions available for download')
            return
        }

        setIsDownloading(true)
        setProgress(0)

        let completedDownloads = 0

        const downloadResults = await Promise.all(submissions.map(async submission => {
            try {
                const blob = await downloadSubmission(submission.id)
                downloadBlob(blob, getFileName(submission))

                return true
            } catch (error) {
                showErrorToast(getErrorMessage(error))

                return false
            } finally {
                completedDownloads += 1
                setProgress(Math.round((completedDownloads / submissions.length) * 100))
            }
        }))

        setIsDownloading(false)

        const failedDownloads = downloadResults.filter(result => result === false).length

        if (failedDownloads > 0) {
            showErrorToast(`Downloaded ${submissions.length - failedDownloads}/${submissions.length} submissions`)
            return
        }

        showSuccessToast(`Downloaded ${submissions.length} submissions`)
    }, [])

    return {
        downloadAll,
        isDownloading,
        progress,
    }
}

export default useDownloadAllSubmissions
