import { Client, init, StoreUploadOptions, UploadOptions } from 'filestack-js'
import { v4 as uuid } from 'uuid'

import { EnvironmentConfig } from '~/config'

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

let filestackClient: Client | undefined

type UploadProgressEvent = {
    totalPercent?: number
}

const getFilestackClient = (): Client => {
    const {
        API_KEY,
        CNAME,
        SECURITY,
    }: typeof EnvironmentConfig.FILESTACK = EnvironmentConfig.FILESTACK

    if (!API_KEY) {
        throw new Error('File uploads are not configured for this environment.')
    }

    if (!filestackClient) {
        filestackClient = init(API_KEY, {
            cname: CNAME,
            security: SECURITY
                ? {
                    policy: SECURITY.POLICY,
                    signature: SECURITY.SIGNATURE,
                }
                : undefined,
        })
    }

    return filestackClient
}

const sanitizeSegment = (segment: string): string => segment
    .trim()
    .replace(/[^a-zA-Z0-9/_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .toLowerCase()

const sanitizeFilename = (filename: string): string => {
    const trimmed = filename.trim()
    const dotIndex = trimmed.lastIndexOf('.')
    const base = dotIndex > -1 ? trimmed.slice(0, dotIndex) : trimmed
    const extension = dotIndex > -1 ? trimmed.slice(dotIndex) : ''
    const safeBase = base
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[-_.]+|[-_.]+$/g, '')
    const safeExtension = extension.replace(/[^a-zA-Z0-9._-]+/g, '')

    return `${safeBase || 'file'}${safeExtension}`
}

const buildStoragePath = (
    file: File,
    options: ReviewAttachmentUploadOptions,
): string => {
    const now = new Date()
    const segments: string[] = [
        EnvironmentConfig.FILESTACK.PATH_PREFIX || 'review-app',
    ]

    if (options.challengeId) {
        segments.push(sanitizeSegment(options.challengeId))
    }

    if (options.category) {
        segments.push(sanitizeSegment(options.category))
    }

    const yearNumber = now.getUTCFullYear()
    const year = yearNumber.toString()
    const monthNumber = now.getUTCMonth() + 1
    const monthString = monthNumber.toString()
    const month = monthString.padStart(2, '0')
    const dayOfMonth = now.getUTCDate()
    const dayString = dayOfMonth.toString()
    const day = dayString.padStart(2, '0')

    segments.push(year, month, day)

    const uniqueName = `${uuid()}-${sanitizeFilename(file.name)}`
    segments.push(uniqueName)

    const filteredSegments: string[] = segments.filter(Boolean)
    return filteredSegments.join('/')
}

const resolveFileUrl = (key?: string, url?: string): string => {
    if (url) {
        return url
    }

    if (!key) {
        throw new Error('Upload succeeded but no file location was returned.')
    }

    const {
        CONTAINER,
        REGION,
    }: Pick<typeof EnvironmentConfig.FILESTACK, 'CONTAINER' | 'REGION'> = EnvironmentConfig.FILESTACK
    const region = REGION?.toLowerCase()
    const baseUrl = region && region !== 'us-east-1'
        ? `https://${CONTAINER}.s3.${region}.amazonaws.com`
        : `https://${CONTAINER}.s3.amazonaws.com`

    return `${baseUrl}/${key}`
}

export const uploadReviewAttachment = async (
    file: File,
    options: ReviewAttachmentUploadOptions = {},
): Promise<ReviewAttachmentUploadResult> => {
    if (!file) {
        throw new Error('No file provided for upload.')
    }

    const client = getFilestackClient()

    const uploadOptions: UploadOptions = {
        onProgress: (progressEvent: UploadProgressEvent) => {
            if (typeof options.onProgress === 'function') {
                const percent = typeof progressEvent?.totalPercent === 'number'
                    ? progressEvent.totalPercent
                    : 0
                options.onProgress(percent)
            }
        },
        progressInterval: EnvironmentConfig.FILESTACK.PROGRESS_INTERVAL,
        retry: EnvironmentConfig.FILESTACK.RETRY,
        timeout: EnvironmentConfig.FILESTACK.TIMEOUT,
    }

    const storeOptions: StoreUploadOptions = {
        container: EnvironmentConfig.FILESTACK.CONTAINER,
        path: buildStoragePath(file, options),
        region: EnvironmentConfig.FILESTACK.REGION,
    }

    try {
        const response: any = await client.upload(file, uploadOptions, storeOptions)

        return {
            filename: response?.originalFilename ?? response?.filename ?? file.name,
            handle: response?.handle,
            key: response?.key,
            mimetype: response?.mimetype ?? response?.type,
            size: response?.size,
            url: resolveFileUrl(response?.key, response?.url),
        }
    } catch (error: unknown) {
        const message = error instanceof Error
            ? error.message
            : 'File upload failed.'
        throw new Error(message)
    }
}

export default uploadReviewAttachment
