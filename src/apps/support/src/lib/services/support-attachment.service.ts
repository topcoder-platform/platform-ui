/** Support attachment validation and shared Files API upload transport. */
import { isAxiosError } from 'axios'

import { uploadFile } from '~/libs/shared/lib/services/s3-upload'

export const MAX_SUPPORT_ATTACHMENT_BYTES = 2 * 1024 * 1024

/** Exact filename-extension to declared-MIME contract enforced for Support by files-api-v6. */
export const SUPPORT_ATTACHMENT_MIME_TYPES_BY_EXTENSION: Readonly<
    Record<string, readonly string[]>
> = {
    '.7z': ['application/x-7z-compressed'],
    '.bmp': ['image/bmp'],
    '.csv': ['text/csv'],
    '.doc': ['application/msword'],
    '.docx': [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    '.gif': ['image/gif'],
    '.gz': ['application/gzip', 'application/x-gzip'],
    '.jpeg': ['image/jpeg'],
    '.jpg': ['image/jpeg'],
    '.json': ['application/json'],
    '.log': ['text/plain'],
    '.pdf': ['application/pdf'],
    '.png': ['image/png'],
    '.ppt': ['application/vnd.ms-powerpoint'],
    '.pptx': [
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    '.rar': ['application/vnd.rar', 'application/x-rar-compressed'],
    '.tar': ['application/x-tar'],
    '.tgz': ['application/gzip', 'application/x-gzip'],
    '.tif': ['image/tiff'],
    '.tiff': ['image/tiff'],
    '.txt': ['text/plain'],
    '.webp': ['image/webp'],
    '.xls': ['application/vnd.ms-excel'],
    '.xlsx': [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    '.xml': ['application/xml', 'text/xml'],
    '.zip': ['application/zip', 'application/x-zip-compressed'],
}

/** Standards-compliant accept tokens derived from the Support API allowlist. */
export const SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES: readonly string[] = [
    ...Object.keys(SUPPORT_ATTACHMENT_MIME_TYPES_BY_EXTENSION),
    ...Array.from(new Set(Object.values(SUPPORT_ATTACHMENT_MIME_TYPES_BY_EXTENSION)
        .flat())),
]

export interface SupportAttachmentUploadOptions {
    onProgress?: (percent: number) => void
}

export interface SupportAttachmentUploadResult {
    filename: string
    handle: string
    key?: string
    mimetype?: string
    size?: number
    url: string
}

/**
 * Uploads a validated Support attachment through the shared Uppy/Files API flow.
 *
 * @param file browser-selected, dropped, or pasted attachment.
 * @param options optional upload-progress callback used by Markdown editors.
 * @returns hosted-file metadata with a durable Files API URL for Markdown insertion.
 * @throws Error when validation or upload fails; gateway/network failures are normalized.
 */
export async function uploadSupportAttachment(
    file: File,
    options: SupportAttachmentUploadOptions = {},
): Promise<SupportAttachmentUploadResult> {
    if (!file) {
        throw new Error('No file provided for upload.')
    }

    if (!file.size) {
        throw new Error('The selected attachment is empty.')
    }

    if (file.size > MAX_SUPPORT_ATTACHMENT_BYTES) {
        throw new Error('The selected attachment is larger than the 2 MB attachment limit.')
    }

    const normalizedFilename = file.name.trim()
    const extensionIndex = normalizedFilename.lastIndexOf('.')
    const extension = extensionIndex >= 0
        ? normalizedFilename.slice(extensionIndex)
            .toLowerCase()
        : ''
    const mimetype = file.type.trim()
        .toLowerCase()
    const allowedMimetypes = SUPPORT_ATTACHMENT_MIME_TYPES_BY_EXTENSION[extension]
    if (!allowedMimetypes?.includes(mimetype)) {
        throw new Error('This file type is not allowed for support attachments.')
    }

    return uploadFile(file, {
        allowedFileTypes: [...SUPPORT_ATTACHMENT_ACCEPTED_UPLOAD_TYPES],
        onProgress: options.onProgress,
        purpose: 'support',
    })
        .catch((error: unknown) => {
            if (isAxiosError(error) && (
                [502, 503, 504].includes(error.response?.status ?? 0)
                || ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(error.code ?? '')
            )) {
                throw new Error('Attachment uploads are temporarily unavailable. Please try again.')
            }

            throw error
        })
}
