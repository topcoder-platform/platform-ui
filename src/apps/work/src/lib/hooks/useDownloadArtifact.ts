import {
    useCallback,
    useMemo,
    useState,
} from 'react'

import { downloadSubmissionArtifact } from '../services'
import { showErrorToast } from '../utils'

export interface UseDownloadArtifactResult {
    downloadArtifact: (submissionId: string, artifactId: string) => Promise<void>
    isLoading: Record<string, boolean>
    isLoadingBool: boolean
}

const MIME_EXTENSION_MAP: Record<string, string> = {
    'application/json': 'json',
    'application/pdf': 'pdf',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/zip': 'zip',
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'text/csv': 'csv',
    'text/plain': 'txt',
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return 'Failed to download submission artifact'
}

function hasFileExtension(fileName: string): boolean {
    const sanitizedFileName = fileName.trim()
    const dotIndex = sanitizedFileName.lastIndexOf('.')

    return dotIndex > 0 && dotIndex < (sanitizedFileName.length - 1)
}

function getFileExtensionByMime(mimeType: string | undefined): string {
    if (!mimeType) {
        return 'zip'
    }

    return MIME_EXTENSION_MAP[mimeType] || 'zip'
}

function normalizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function buildArtifactFileName(
    artifactId: string,
    blob: Blob,
    submissionId: string,
): string {
    const normalizedArtifactId = normalizeFileName(artifactId.trim())
    if (normalizedArtifactId && hasFileExtension(normalizedArtifactId)) {
        return normalizedArtifactId
    }

    const extension = getFileExtensionByMime(blob.type)
    const fileNameBase = normalizedArtifactId || `artifact-${submissionId}`

    return `${fileNameBase}.${extension}`
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

function getLoadingKey(submissionId: string, artifactId: string): string {
    return `${submissionId}:${artifactId}`
}

export function useDownloadArtifact(): UseDownloadArtifactResult {
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})

    const isLoadingBool = useMemo(
        () => Object.values(isLoading)
            .some(value => value === true),
        [isLoading],
    )

    const downloadArtifact = useCallback(async (
        submissionId: string,
        artifactId: string,
    ): Promise<void> => {
        const normalizedSubmissionId = submissionId.trim()
        const normalizedArtifactId = artifactId.trim()

        if (!normalizedSubmissionId || !normalizedArtifactId) {
            return
        }

        const loadingKey = getLoadingKey(
            normalizedSubmissionId,
            normalizedArtifactId,
        )

        setIsLoading(previousState => ({
            ...previousState,
            [loadingKey]: true,
        }))

        try {
            const blob = await downloadSubmissionArtifact(
                normalizedSubmissionId,
                normalizedArtifactId,
            )
            const fileName = buildArtifactFileName(
                normalizedArtifactId,
                blob,
                normalizedSubmissionId,
            )

            downloadBlob(blob, fileName)
        } catch (error) {
            showErrorToast(getErrorMessage(error))
        } finally {
            setIsLoading(previousState => ({
                ...previousState,
                [loadingKey]: false,
            }))
        }
    }, [])

    return {
        downloadArtifact,
        isLoading,
        isLoadingBool,
    }
}

export default useDownloadArtifact
