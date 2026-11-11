import { uploadFile } from '~/libs/shared/lib/services/s3-upload'

export interface EngagementAttachmentUploadOptions {
    engagementId?: string
    assignmentId?: string
    category?: string
    onProgress?: (percent: number) => void
}

export interface EngagementAttachmentUploadResult {
    url: string
    handle: string
    key?: string
    filename: string
    mimetype?: string
    size?: number
}

export const uploadEngagementAttachment = async (
    file: File,
    options: EngagementAttachmentUploadOptions = {},
): Promise<EngagementAttachmentUploadResult> => uploadFile(file, {
    contextId: options.engagementId,
    onProgress: options.onProgress,
    purpose: options.category === 'application-cv' ? 'cv' : 'engagement',
})

export default uploadEngagementAttachment
