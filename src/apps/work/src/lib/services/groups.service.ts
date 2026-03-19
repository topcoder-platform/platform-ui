import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrGetPaginatedAsync,
    xhrPatchAsync,
    xhrPostAsync,
    xhrPutAsync,
} from '~/libs/core'

import { GROUPS_API_URL } from '../constants'
import {
    Group,
    GroupBulkCreateMemberResult,
    GroupBulkCreatePayload,
    GroupBulkCreateResponse,
    GroupCreatePayload,
    GroupMember,
    GroupMemberCreatePayload,
    GroupPatchPayload,
    GroupUpdatePayload,
} from '../models'

const GROUPS_PER_PAGE = 1000
const GROUP_MEMBERS_PER_PAGE = 1000

interface GroupsServiceErrorData {
    memberResults?: unknown
    message?: string | string[]
}

interface GroupsServiceErrorLike {
    memberResults?: unknown
    message?: string
    response?: {
        data?: GroupsServiceErrorData
    }
}

export interface GroupServiceError extends Error {
    memberResults?: GroupBulkCreateMemberResult[]
}

function toOptionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString()
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

function toOptionalBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'string') {
        const normalizedValue = value.trim()
            .toLowerCase()

        if (normalizedValue === 'true') {
            return true
        }

        if (normalizedValue === 'false') {
            return false
        }
    }

    return undefined
}

function normalizeBulkCreateMemberResult(
    value: unknown,
): GroupBulkCreateMemberResult | undefined {
    if (typeof value !== 'object' || !value) {
        return undefined
    }

    const typedValue = value as Partial<GroupBulkCreateMemberResult>
    const userId = toOptionalString(typedValue.userId)
    const success = toOptionalBoolean(typedValue.success)

    if (!userId || success === undefined) {
        return undefined
    }

    return {
        error: toOptionalString(typedValue.error),
        success,
        userId,
    }
}

function normalizeBulkCreateMemberResults(values: unknown): GroupBulkCreateMemberResult[] {
    if (!Array.isArray(values)) {
        return []
    }

    return values
        .map(value => normalizeBulkCreateMemberResult(value))
        .filter((value): value is GroupBulkCreateMemberResult => !!value)
}

function normalizeError(error: unknown, fallbackMessage: string): GroupServiceError {
    const typedError = error as {
        message?: string
        response?: {
            data?: GroupsServiceErrorData
        }
    } & GroupsServiceErrorLike
    const responseMessage = typedError?.response?.data?.message
    const errorMessage = Array.isArray(responseMessage)
        ? responseMessage.join(', ')
        : responseMessage
            || typedError?.message
        || fallbackMessage

    const normalizedError: GroupServiceError = new Error(errorMessage)
    const memberResults = normalizeBulkCreateMemberResults(
        typedError?.memberResults
        || typedError?.response?.data?.memberResults,
    )

    if (memberResults.length > 0) {
        normalizedError.memberResults = memberResults
    }

    return normalizedError
}

function normalizeGroup(group: Partial<Group>): Group | undefined {
    const id = group.id !== undefined && group.id !== null
        ? String(group.id)
        : ''
    const name = typeof group.name === 'string'
        ? group.name.trim()
        : ''

    if (!id || !name) {
        return undefined
    }

    return {
        description: typeof group.description === 'string'
            ? group.description
            : undefined,
        id,
        name,
        oldId: toOptionalString(group.oldId),
        privateGroup: toOptionalBoolean(group.privateGroup),
        selfRegister: toOptionalBoolean(group.selfRegister),
        status: toOptionalString(group.status),
    }
}

function normalizeGroupMember(value: unknown): GroupMember | undefined {
    if (typeof value !== 'object' || !value) {
        return undefined
    }

    const typedValue = value as Partial<GroupMember>
    const id = toOptionalString(typedValue.id)
    const groupId = toOptionalString(typedValue.groupId)
    const memberId = toOptionalString(typedValue.memberId)
    const membershipTypeValue = toOptionalString(typedValue.membershipType)
        ?.toLowerCase()
    const membershipType = membershipTypeValue === 'group'
        ? 'group'
        : membershipTypeValue === 'user'
            ? 'user'
            : undefined

    if (!id || !groupId || !memberId || !membershipType) {
        return undefined
    }

    return {
        createdAt: toOptionalString(typedValue.createdAt),
        groupId,
        groupName: toOptionalString(typedValue.groupName),
        id,
        memberId,
        membershipType,
        universalUID: toOptionalString(typedValue.universalUID),
    }
}

export async function fetchGroups(filters?: { name?: string }): Promise<Group[]> {
    const query = new URLSearchParams({
        page: '1',
        perPage: String(GROUPS_PER_PAGE),
    })

    const groupNameFilter = filters?.name?.trim()
    if (groupNameFilter) {
        query.set('name', groupNameFilter)
    }

    try {
        const response = await xhrGetPaginatedAsync<Group[]>(
            `${GROUPS_API_URL}?${query.toString()}`,
        )

        return (response.data || [])
            .map(group => normalizeGroup(group))
            .filter((group): group is Group => !!group)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch groups')
    }
}

export async function fetchGroupById(id: string): Promise<Group> {
    try {
        const group = await xhrGetAsync<Partial<Group>>(
            `${GROUPS_API_URL}/${encodeURIComponent(id)}`,
        )

        const normalizedGroup = normalizeGroup(group)

        if (!normalizedGroup) {
            throw new Error('Group details are missing required fields')
        }

        return normalizedGroup
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch group details')
    }
}

export async function createGroup(groupData: GroupCreatePayload): Promise<Group> {
    try {
        const createdGroup = await xhrPostAsync<GroupCreatePayload, Partial<Group>>(
            GROUPS_API_URL,
            groupData,
        )

        const normalizedGroup = normalizeGroup(createdGroup)

        if (!normalizedGroup) {
            throw new Error('Failed to create group')
        }

        return normalizedGroup
    } catch (error) {
        throw normalizeError(error, 'Failed to create group')
    }
}

export async function bulkCreateGroup(
    groupData: GroupBulkCreatePayload,
): Promise<GroupBulkCreateResponse> {
    try {
        const createdGroup = await xhrPostAsync<GroupBulkCreatePayload, unknown>(
            `${GROUPS_API_URL}/bulk-create`,
            groupData,
        )
        const normalizedGroup = normalizeGroup(createdGroup as Partial<Group>)
        const memberResults = normalizeBulkCreateMemberResults(
            (createdGroup as {
                memberResults?: unknown
            }).memberResults,
        )

        if (!normalizedGroup) {
            throw new Error('Failed to create group')
        }

        return {
            ...normalizedGroup,
            memberResults,
        }
    } catch (error) {
        throw normalizeError(error, 'Failed to create group')
    }
}

export async function updateGroup(
    id: string,
    groupData: GroupUpdatePayload,
): Promise<Group> {
    try {
        const updatedGroup = await xhrPutAsync<GroupUpdatePayload, Partial<Group>>(
            `${GROUPS_API_URL}/${encodeURIComponent(id)}`,
            groupData,
        )
        const normalizedGroup = normalizeGroup(updatedGroup)

        if (!normalizedGroup) {
            throw new Error('Failed to update group')
        }

        return normalizedGroup
    } catch (error) {
        throw normalizeError(error, 'Failed to update group')
    }
}

export async function patchGroup(
    id: string,
    groupData: GroupPatchPayload,
): Promise<Group> {
    try {
        const patchedGroup = await xhrPatchAsync<GroupPatchPayload, Partial<Group>>(
            `${GROUPS_API_URL}/${encodeURIComponent(id)}`,
            groupData,
        )
        const normalizedGroup = normalizeGroup(patchedGroup)

        if (!normalizedGroup) {
            throw new Error('Failed to patch group')
        }

        return normalizedGroup
    } catch (error) {
        throw normalizeError(error, 'Failed to patch group')
    }
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
    const query = new URLSearchParams({
        page: '1',
        perPage: String(GROUP_MEMBERS_PER_PAGE),
    })

    try {
        const response = await xhrGetPaginatedAsync<unknown[]>(
            `${GROUPS_API_URL}/${encodeURIComponent(groupId)}/members?${query.toString()}`,
        )

        return (response.data || [])
            .map(groupMember => normalizeGroupMember(groupMember))
            .filter((groupMember): groupMember is GroupMember => !!groupMember)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch group members')
    }
}

export async function addGroupMember(
    groupId: string,
    payload: GroupMemberCreatePayload,
): Promise<void> {
    try {
        await xhrPostAsync<GroupMemberCreatePayload, unknown>(
            `${GROUPS_API_URL}/${encodeURIComponent(groupId)}/members`,
            payload,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to add group member')
    }
}

export async function removeGroupMember(
    groupId: string,
    memberId: string,
): Promise<void> {
    try {
        await xhrDeleteAsync<unknown>(
            `${GROUPS_API_URL}/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}`,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to remove group member')
    }
}
