import {
    xhrDeleteAsync,
    xhrPatchAsync,
    xhrPostAsync,
} from '~/libs/core'

import { PROJECTS_API_URL } from '../constants'
import { ProjectInvite } from '../models'

const PROJECT_MEMBER_INVITE_FIELDS
    = 'id,projectId,userId,email,role,status,createdAt,updatedAt,createdBy,updatedBy,handle'

interface UnknownRecord {
    [key: string]: unknown
}

export interface InviteParams {
    emails?: string[]
    handles?: string[]
    role: string
}

export interface InviteResponse {
    success: ProjectInvite[]
    failed?: UnknownRecord[]
    message?: string
}

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

function toOptionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

function toOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }

    if (typeof value === 'string') {
        const parsedValue = Number(value)
        if (Number.isFinite(parsedValue)) {
            return parsedValue
        }
    }

    return undefined
}

function normalizeInvite(invite: unknown): ProjectInvite | undefined {
    if (typeof invite !== 'object' || !invite) {
        return undefined
    }

    const typedInvite = invite as UnknownRecord
    const id = toOptionalString(typedInvite.id)
    const email = toOptionalString(typedInvite.email)
    const userId = toOptionalNumber(typedInvite.userId)
    const role = toOptionalString(typedInvite.role)
    const status = toOptionalString(typedInvite.status)
    const projectId = toOptionalString(typedInvite.projectId)
    const createdAt = toOptionalString(typedInvite.createdAt)
    const updatedAt = toOptionalString(typedInvite.updatedAt)
    const handle = toOptionalString(typedInvite.handle)

    if (!id && !email && userId === undefined && !role && !status && !projectId) {
        return undefined
    }

    return {
        createdAt,
        email,
        handle,
        id,
        projectId,
        role,
        status,
        updatedAt,
        userId,
    }
}

function normalizeInviteList(value: unknown): ProjectInvite[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map(item => normalizeInvite(item))
        .filter((item): item is ProjectInvite => !!item)
}

function normalizeInviteParams(params: InviteParams): InviteParams {
    const normalizedEmails = Array.from(new Set(
        (params.emails || [])
            .map(email => email.trim())
            .filter(Boolean),
    ))
    const normalizedHandles = Array.from(new Set(
        (params.handles || [])
            .map(handle => handle.trim())
            .filter(Boolean),
    ))

    return {
        emails: normalizedEmails.length
            ? normalizedEmails
            : undefined,
        handles: normalizedHandles.length
            ? normalizedHandles
            : undefined,
        role: params.role.trim(),
    }
}

function normalizeInviteResponse(response: unknown): InviteResponse {
    if (typeof response !== 'object' || !response) {
        return {
            success: [],
        }
    }

    const typedResponse = response as {
        failed?: unknown
        message?: unknown
        success?: unknown
    }

    const failed = Array.isArray(typedResponse.failed)
        ? typedResponse.failed as UnknownRecord[]
        : undefined
    const message = toOptionalString(typedResponse.message)

    return {
        failed,
        message,
        success: normalizeInviteList(typedResponse.success),
    }
}

/**
 * Create project member invite.
 */
export async function createProjectMemberInvite(
    projectId: string,
    params: InviteParams,
): Promise<InviteResponse> {
    const query = new URLSearchParams({
        fields: PROJECT_MEMBER_INVITE_FIELDS,
    })

    try {
        const response = await xhrPostAsync<InviteParams, unknown>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}/invites?${query.toString()}`,
            normalizeInviteParams(params),
        )

        return normalizeInviteResponse(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to create project member invite')
    }
}

/**
 * Delete project member invite.
 */
export async function deleteProjectMemberInvite(
    projectId: string,
    inviteId: string,
): Promise<void> {
    try {
        await xhrDeleteAsync<unknown>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}/invites/${encodeURIComponent(inviteId)}`,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to delete project member invite')
    }
}

/**
 * Update project member invite status.
 */
export async function updateProjectMemberInvite(
    projectId: string,
    inviteId: string,
    status: string,
    source?: string,
): Promise<ProjectInvite> {
    const payload: {
        source?: string
        status: string
    } = {
        status: status.trim(),
    }

    if (source?.trim()) {
        payload.source = source.trim()
    }

    try {
        const response = await xhrPatchAsync<typeof payload, unknown>(
            `${PROJECTS_API_URL}/${encodeURIComponent(projectId)}/invites/${encodeURIComponent(inviteId)}`,
            payload,
        )

        const invite = normalizeInvite(response)

        if (!invite) {
            throw new Error('Updated project invite payload is invalid')
        }

        return invite
    } catch (error) {
        throw normalizeError(error, 'Failed to update project member invite')
    }
}
