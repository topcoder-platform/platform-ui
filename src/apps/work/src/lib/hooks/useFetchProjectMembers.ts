import useSWR, { SWRResponse } from 'swr'

import {
    ProjectInvite,
    ProjectMember,
} from '../models'
import {
    fetchInvitedMembers,
    fetchProjectById,
} from '../services'

interface ProjectMembersData {
    invites: ProjectInvite[]
    members: ProjectMember[]
}

export interface UseFetchProjectMembersResult {
    invites: ProjectInvite[]
    members: ProjectMember[]
    isLoading: boolean
    error: Error | undefined
    mutate: SWRResponse<ProjectMembersData, Error>['mutate']
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

function normalizeMember(member: ProjectMember): ProjectMember | undefined {
    const id = toOptionalString(member.id)
    const userId = toOptionalNumber(member.userId)
    const email = toOptionalString(member.email)
    const handle = toOptionalString(member.handle)
    const role = toOptionalString(member.role)
    const projectId = toOptionalString(member.projectId)
    const createdAt = toOptionalString(member.createdAt)
    const updatedAt = toOptionalString(member.updatedAt)

    if (!id && userId === undefined && !handle && !role && !email) {
        return undefined
    }

    return {
        createdAt,
        email,
        handle,
        id,
        projectId,
        role,
        updatedAt,
        userId,
    }
}

function normalizeInvite(
    invite: ProjectInvite,
    inviteHandleMap: Record<number, {
        handle: string
    }>,
): ProjectInvite | undefined {
    const id = toOptionalString(invite.id)
    const email = toOptionalString(invite.email)
    const userId = toOptionalNumber(invite.userId)
    const role = toOptionalString(invite.role)
    const status = toOptionalString(invite.status)
    const projectId = toOptionalString(invite.projectId)
    const createdAt = toOptionalString(invite.createdAt)
    const updatedAt = toOptionalString(invite.updatedAt)
    const handle = toOptionalString(invite.handle)
        || (userId !== undefined
            ? inviteHandleMap[userId]?.handle
            : undefined)

    if (!id && !email && userId === undefined && !role && !status && !handle) {
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

async function fetchProjectMembers(projectId: string): Promise<ProjectMembersData> {
    const project = await fetchProjectById(projectId)
    const normalizedProjectId = toOptionalString(project.id)
    const members = Array.isArray(project.members)
        ? project.members
            .map(member => normalizeMember(member))
            .filter((member): member is ProjectMember => !!member)
            .map(member => ({
                ...member,
                projectId: member.projectId || normalizedProjectId,
            }))
        : []
    const invites = Array.isArray(project.invites)
        ? project.invites
        : []
    const invitedUserIds = Array.from(new Set(
        invites
            .map(invite => toOptionalNumber(invite.userId))
            .filter((userId): userId is number => userId !== undefined),
    ))
    const inviteHandleMap = invitedUserIds.length
        ? await fetchInvitedMembers(invitedUserIds)
        : {}

    return {
        invites: invites
            .map(invite => normalizeInvite(invite, inviteHandleMap))
            .filter((invite): invite is ProjectInvite => !!invite)
            .map(invite => ({
                ...invite,
                projectId: invite.projectId || normalizedProjectId,
            })),
        members,
    }
}

export function useFetchProjectMembers(projectId: string | undefined): UseFetchProjectMembersResult {
    const swrKey = projectId
        ? ['work/project-members', projectId]
        : undefined

    const {
        data,
        error,
        mutate,
    }: SWRResponse<ProjectMembersData, Error>
        = useSWR<ProjectMembersData, Error>(
            swrKey,
            () => fetchProjectMembers(projectId as string),
            {
                errorRetryCount: 2,
                shouldRetryOnError: true,
            },
        )

    return {
        error,
        invites: data?.invites || [],
        isLoading: !!projectId && !data && !error,
        members: data?.members || [],
        mutate,
    }
}

export default useFetchProjectMembers
