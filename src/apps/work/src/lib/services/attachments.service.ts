import {
    xhrCreateInstance,
    xhrDeleteAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    CHALLENGE_API_URL,
    CHALLENGE_API_VERSION,
} from '../constants'
import {
    Attachment,
    AttachmentPayload,
} from '../models'

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        message?: string
        response?: {
            data?: {
                message?: string
            }
        }
    }

    const errorMessage = typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage

    return new Error(errorMessage)
}

function normalizeAttachment(attachment: Partial<Attachment>): Attachment | undefined {
    const name = typeof attachment.name === 'string'
        ? attachment.name.trim()
        : ''
    const url = typeof attachment.url === 'string'
        ? attachment.url.trim()
        : ''

    if (!name || !url) {
        return undefined
    }

    return {
        fileSize: typeof attachment.fileSize === 'number'
            ? attachment.fileSize
            : undefined,
        id: attachment.id !== undefined && attachment.id !== null
            ? String(attachment.id)
            : undefined,
        name,
        url,
    }
}

const challengeServiceXhrInstance = xhrCreateInstance()

if (CHALLENGE_API_VERSION) {
    challengeServiceXhrInstance.defaults.headers.common['app-version'] = CHALLENGE_API_VERSION
}

export async function createAttachments(
    challengeId: string,
    attachments: AttachmentPayload[],
): Promise<Attachment[]> {
    try {
        const response = await xhrPostAsync<AttachmentPayload[], Attachment[]>(
            `${CHALLENGE_API_URL}/${encodeURIComponent(challengeId)}/attachments`,
            attachments,
            undefined,
            challengeServiceXhrInstance,
        )

        return (response || [])
            .map(attachment => normalizeAttachment(attachment))
            .filter((attachment): attachment is Attachment => !!attachment)
    } catch (error) {
        throw normalizeError(error, 'Failed to create attachments')
    }
}

export async function deleteAttachment(
    challengeId: string,
    attachmentId: string,
): Promise<void> {
    try {
        await xhrDeleteAsync<unknown>(
            `${CHALLENGE_API_URL}/${encodeURIComponent(challengeId)}/attachments/${encodeURIComponent(attachmentId)}`,
            challengeServiceXhrInstance,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to remove attachment')
    }
}
