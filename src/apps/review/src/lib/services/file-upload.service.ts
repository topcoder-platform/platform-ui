import { uploadFile } from '~/libs/shared/lib/services/s3-upload'

export interface ReviewAttachmentUploadOptions {
    challengeId?: string
    category?: string
    onProgress?: (percent: number) => void
}

export interface ReviewAttachmentUploadResult {
    url: string
    handle: string
    key?: string
    filename: string
    mimetype?: string
    size?: number
}

export const uploadReviewAttachment = async (
    file: File,
    options: ReviewAttachmentUploadOptions = {},
): Promise<ReviewAttachmentUploadResult> => uploadFile(file, {
    contextId: options.challengeId,
    onProgress: options.onProgress,
    purpose: 'review',
})

export default uploadReviewAttachment
