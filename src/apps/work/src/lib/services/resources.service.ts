import {
    xhrCreateInstance,
    xhrGetAsync,
    xhrGetPaginatedAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    RESOURCES_API_URL,
    RESOURCE_ROLES_API_URL,
} from '../constants'
import {
    Resource,
    ResourcePayload,
    ResourceRole,
} from '../models'

const CHALLENGE_RESOURCES_PER_PAGE = 5000

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

function toOptionalFiniteNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value)
        ? value
        : undefined
}

function toOptionalString(value: unknown): string | undefined {
    return value !== undefined && value !== null
        ? String(value)
        : undefined
}

function toOptionalBoolean(value: unknown): boolean | undefined {
    return typeof value === 'boolean'
        ? value
        : undefined
}

function toRequiredString(value: unknown): string {
    return value !== undefined && value !== null
        ? String(value)
        : ''
}

function normalizeResource(resource: Partial<Resource>): Resource | undefined {
    const challengeId = toRequiredString(resource.challengeId)
    const roleId = toRequiredString(resource.roleId)

    if (!challengeId || !roleId) {
        return undefined
    }

    return {
        challengeId,
        created: toOptionalString(resource.created),
        email: toOptionalString(resource.email),
        id: toOptionalString(resource.id),
        memberHandle: toOptionalString(resource.memberHandle),
        memberId: toOptionalString(resource.memberId),
        rating: toOptionalFiniteNumber(resource.rating),
        role: toOptionalString(resource.role),
        roleId,
        roleName: toOptionalString(resource.roleName),
    }
}

function normalizeResourceRole(resourceRole: Partial<ResourceRole>): ResourceRole | undefined {
    const id = resourceRole.id !== undefined && resourceRole.id !== null
        ? String(resourceRole.id)
        : ''
    const name = typeof resourceRole.name === 'string'
        ? resourceRole.name.trim()
        : ''

    if (!id || !name) {
        return undefined
    }

    return {
        fullReadAccess: toOptionalBoolean(resourceRole.fullReadAccess),
        fullWriteAccess: toOptionalBoolean(resourceRole.fullWriteAccess),
        id,
        isActive: toOptionalBoolean(resourceRole.isActive),
        name,
        selfObtainable: toOptionalBoolean(resourceRole.selfObtainable),
    }
}

export async function fetchResources(challengeId: string): Promise<Resource[]> {
    const normalizedChallengeId = challengeId.trim()

    if (!normalizedChallengeId) {
        return []
    }

    const buildResourceUrl = (page: number): string => `${RESOURCES_API_URL}`
        + `?challengeId=${encodeURIComponent(normalizedChallengeId)}`
        + `&page=${page}&perPage=${CHALLENGE_RESOURCES_PER_PAGE}`

    try {
        const firstPageResponse = await xhrGetPaginatedAsync<Resource[]>(
            buildResourceUrl(1),
        )
        const totalPages = firstPageResponse.totalPages || 1

        const firstPageResources = (firstPageResponse.data || [])
            .map(resource => normalizeResource(resource))
            .filter((resource): resource is Resource => !!resource)

        if (totalPages <= 1) {
            return firstPageResources
        }

        const extraPageNumbers = Array.from({
            length: totalPages - 1,
        }, (_, index) => index + 2)

        const extraPageResponses = await Promise.all(extraPageNumbers
            .map(pageNumber => xhrGetPaginatedAsync<Resource[]>(
                buildResourceUrl(pageNumber),
            )))

        const extraPageResources = extraPageResponses
            .flatMap(response => response.data || [])
            .map(resource => normalizeResource(resource))
            .filter((resource): resource is Resource => !!resource)

        return [
            ...firstPageResources,
            ...extraPageResources,
        ]
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch challenge resources')
    }
}

export async function createResource(resource: ResourcePayload): Promise<Resource> {
    try {
        const createdResource = await xhrPostAsync<ResourcePayload, Partial<Resource>>(
            RESOURCES_API_URL,
            resource,
        )

        const normalizedResource = normalizeResource(createdResource)

        if (!normalizedResource) {
            throw new Error('Resource payload is missing required fields')
        }

        return normalizedResource
    } catch (error) {
        throw normalizeError(error, 'Failed to create challenge resource')
    }
}

export async function deleteResource(resource: ResourcePayload): Promise<void> {
    try {
        const xhrInstance = xhrCreateInstance()

        await xhrInstance.delete(RESOURCES_API_URL, {
            data: resource,
        })
    } catch (error) {
        throw normalizeError(error, 'Failed to delete challenge resource')
    }
}

export interface UpdateResourceRolePayload {
    challengeId: string
    currentRoleId: string
    memberHandle?: string
    memberId?: string
    newRoleId: string
}

export async function updateResourceRoleAssignment(
    payload: UpdateResourceRolePayload,
): Promise<Resource> {
    const deletePayload: ResourcePayload = {
        challengeId: payload.challengeId,
        memberHandle: payload.memberHandle,
        memberId: payload.memberId,
        roleId: payload.currentRoleId,
    }
    const createPayload: ResourcePayload = {
        challengeId: payload.challengeId,
        memberHandle: payload.memberHandle,
        memberId: payload.memberId,
        roleId: payload.newRoleId,
    }

    try {
        await deleteResource(deletePayload)
    } catch (error) {
        throw normalizeError(error, 'Failed to remove current resource role')
    }

    try {
        return await createResource(createPayload)
    } catch (error) {
        try {
            await createResource(deletePayload)
        } catch (rollbackError) {
            const rollbackMessage = normalizeError(
                rollbackError,
                'Failed to rollback previous resource role',
            ).message

            throw normalizeError(
                error,
                `Failed to assign new resource role. ${rollbackMessage}.`,
            )
        }

        throw normalizeError(error, 'Failed to assign new resource role')
    }
}

export async function fetchResourceRoles(): Promise<ResourceRole[]> {
    try {
        const response = await xhrGetAsync<ResourceRole[]>(RESOURCE_ROLES_API_URL)

        return (response || [])
            .map(role => normalizeResourceRole(role))
            .filter((role): role is ResourceRole => !!role)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch resource roles')
    }
}
