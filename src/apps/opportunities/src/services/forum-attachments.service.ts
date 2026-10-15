import { init } from 'filestack-js'

import { EnvironmentConfig } from '~/config'

/** Uploads a selected forum attachment using the existing configured Filestack service.
 * @param file Image or downloadable attachment, limited to 25 MiB.
 * @returns Escaped Markdown link using the durable HTTPS URL.
 * @throws Error for invalid size/configuration/response or upload failure.
 */
export async function uploadForumAttachment(file: File): Promise<string> {
    if (!file.size || file.size > 25 * 1024 * 1024) throw new Error('Choose a file between 1 byte and 25 MB.')
    const config = EnvironmentConfig.FILESTACK
    if (!config.API_KEY) throw new Error('File uploads are not configured for this environment.')
    const client = init(config.API_KEY, {
        cname: config.CNAME,
        security: config.SECURITY
            ? { policy: config.SECURITY.POLICY, signature: config.SECURITY.SIGNATURE }
            : undefined,
    })
    const result = await client.upload(file, { retry: config.RETRY, timeout: config.TIMEOUT })
    const url = new URL(result.url)
    if (url.protocol !== 'https:') throw new Error('The upload service returned an invalid attachment URL.')
    const label = file.name.replace(/[\\[\]<>]/g, '')
        .replace(/[\r\n]/g, ' ') || 'Attachment'
    const image = /^image\/(png|jpeg|gif|webp|avif)$/.test(file.type)
    return `${image ? '!' : ''}[${label}](<${url.href}>)`
}
