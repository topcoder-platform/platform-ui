/** Authenticated attachment uploader for support-api-v6. */
import { xhrPostAsync } from '~/libs/core'

import { SUPPORT_API_BASE } from './support.service'

export const MAX_SUPPORT_ATTACHMENT_BYTES = 2 * 1024 * 1024

/** Exact filename-extension to declared-MIME contract enforced by support-api-v6. */
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
 * Uploads one attachment through the authenticated Support API rather than
 * connecting the browser directly to a storage bucket.
 *
 * @param file browser-selected, dropped, or pasted attachment.
 * @param options optional upload-progress callback used by Markdown editors.
 * @returns canonical hosted-file metadata for Markdown insertion.
 * @throws Error when no file is supplied, the file is empty, larger than 2 MiB,
 * does not match the Support API extension/MIME allowlist, or support-api-v6
 * rejects or cannot complete the upload.
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

    const formData = new FormData()
    formData.append('file', file, file.name)

    return xhrPostAsync<FormData, SupportAttachmentUploadResult>(
        `${SUPPORT_API_BASE}/attachments`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: progressEvent => {
                if (!options.onProgress) return

                const ratio = typeof progressEvent.progress === 'number'
                    ? progressEvent.progress
                    : progressEvent.total
                        ? progressEvent.loaded / progressEvent.total
                        : 0
                options.onProgress(Math.max(0, Math.min(100, Math.round(ratio * 100))))
            },
        },
    )
}
