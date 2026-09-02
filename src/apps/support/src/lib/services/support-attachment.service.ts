/** Authenticated attachment uploader for support-api-v6. */
import { xhrPostAsync } from '~/libs/core'

import { SUPPORT_API_BASE } from './support.service'

export const MAX_SUPPORT_ATTACHMENT_BYTES = 2 * 1024 * 1024

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
 * @throws Error when no file is supplied, the file is empty or larger than 2 MiB,
 * or support-api-v6 rejects or cannot complete the upload.
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
