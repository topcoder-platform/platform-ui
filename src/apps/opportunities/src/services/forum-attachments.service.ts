import { pickFiles, UploadedFile, uploadFile } from '~/libs/shared/lib/services/s3-upload'

/** Uploads a selected forum attachment using the shared Uppy S3 uploader.
 * @param file Image or downloadable attachment, limited to 25 MiB.
 * @returns Escaped Markdown link using the durable HTTPS URL.
 * @throws Error for invalid size/configuration/response or upload failure.
 */
export async function uploadForumAttachment(file: File): Promise<string> {
    if (!file.size || file.size > 25 * 1024 * 1024) throw new Error('Choose a file between 1 byte and 25 MB.')
    const result = await uploadFile(file, { purpose: 'forum' })
    return attachmentMarkdown(result)
}

function attachmentMarkdown(file: UploadedFile): string {
    const url = new URL(file.url)
    if (url.protocol !== 'https:') throw new Error('The upload service returned an invalid attachment URL.')
    const label = file.filename.replace(/[\\[\]<>]/g, '')
        .replace(/[\r\n]/g, ' ') || 'Attachment'
    const image = /^image\/(png|jpeg|gif|webp|avif)$/.test(file.mimetype)
    return `${image ? '!' : ''}[${label}](<${url.href}>)`
}

export async function pickForumAttachments(): Promise<string> {
    const files = await pickFiles({ maxFiles: 4, purpose: 'forum' })
    return files.map(attachmentMarkdown)
        .join('\n')
}
