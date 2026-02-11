import { decodeToken } from 'tc-auth-lib'

import { PROJECT_ROLES } from '../constants'
import {
    ADMIN_ROLES,
    ALLOWED_DOWNLOAD_SUBMISSIONS_ROLES,
    ALLOWED_EDIT_RESOURCE_ROLES,
    ALLOWED_USER_ROLES,
    COPILOT_ROLES,
    MANAGER_ROLES,
    READ_ONLY_ROLES,
    SUBMITTER_ROLE_UUID,
    TASK_MANAGER_ROLES,
} from '../constants/roles.constants'
import {
    Challenge,
    Project,
    ProjectInvite,
    ProjectMember,
    ResourceRole,
    User,
} from '../models'
import {
    fetchResourceRoles,
    fetchResources,
} from '../services/resources.service'

interface DecodedTokenData {
    email?: string
    handle?: string
    roles?: string[]
    userId?: number | string
}

export interface CheckChallengeEditPermissionOptions {
    hasProjectAccess?: boolean
    loggedInUserId?: number | string
    token: string
}

function normalizeValue(value: unknown): string {
    return typeof value === 'string'
        ? value.trim()
            .toLowerCase()
        : ''
}

function getTokenData(token: string): DecodedTokenData {
    if (!token.trim()) {
        return {}
    }

    try {
        return (decodeToken(token) || {}) as DecodedTokenData
    } catch {
        return {}
    }
}

function getTokenRoles(token: string): string[] {
    const roles = getTokenData(token).roles

    if (!Array.isArray(roles)) {
        return []
    }

    return roles
}

function hasRole(userRoles: string[], allowedRoles: readonly string[]): boolean {
    return userRoles.some(role => allowedRoles.includes(normalizeValue(role)))
}

function hasAdminRole(userRoles: string[]): boolean {
    return hasRole(userRoles, ADMIN_ROLES)
}

function hasManagerRole(userRoles: string[]): boolean {
    return hasRole(userRoles, MANAGER_ROLES)
}

function hasTaskManagerRole(userRoles: string[]): boolean {
    return hasRole(userRoles, TASK_MANAGER_ROLES)
}

function hasCopilotRole(userRoles: string[]): boolean {
    return hasRole(userRoles, COPILOT_ROLES)
}

function hasDownloadSubmissionsRole(userRoles: string[]): boolean {
    return hasRole(userRoles, ALLOWED_DOWNLOAD_SUBMISSIONS_ROLES)
}

function isChallengeCreator(challenge: Challenge, loginUserInfo?: User): boolean {
    const challengeCreator = normalizeValue(challenge.createdBy)

    if (!challengeCreator || !loginUserInfo) {
        return false
    }

    const loginHandle = normalizeValue(loginUserInfo.handle)
    const loginUserId = normalizeValue(loginUserInfo.userId)

    return challengeCreator === loginHandle || challengeCreator === loginUserId
}

function checkAllowedRoles(roles: string[]): boolean {
    const allowedUserRoles: readonly string[] = ALLOWED_USER_ROLES

    return roles.some(role => allowedUserRoles.includes(normalizeValue(role)))
}

export function canEditChallengeResources(
    challenge: Challenge,
    userRoles: string[],
    loginUserInfo?: User,
): boolean {
    if (hasAdminRole(userRoles) || hasManagerRole(userRoles) || hasCopilotRole(userRoles)) {
        return true
    }

    return isChallengeCreator(challenge, loginUserInfo)
}

export function canDownloadSubmissions(userRoles: string[]): boolean {
    if (hasAdminRole(userRoles)) {
        return true
    }

    return hasDownloadSubmissionsRole(userRoles)
}

export function canCreateTaasProject(userRoles: string[]): boolean {
    return hasAdminRole(userRoles) || hasCopilotRole(userRoles)
}

export function canEditTaasProject(userRoles: string[]): boolean {
    return hasAdminRole(userRoles) || hasCopilotRole(userRoles)
}

export function checkIsAdmin(token: string): boolean {
    const roles = getTokenRoles(token)

    return hasAdminRole(roles)
}

export function checkIsManager(token: string): boolean {
    const roles = getTokenRoles(token)

    return hasManagerRole(roles)
}

export function checkTaskManager(token: string): boolean {
    const roles = getTokenRoles(token)

    return hasTaskManagerRole(roles)
}

export function checkAdminOrPmOrTaskManager(
    token: string,
    project?: Project,
): boolean {
    const tokenData = getTokenData(token)
    const roles = Array.isArray(tokenData.roles)
        ? tokenData.roles
        : []
    const userId = tokenData.userId !== undefined && tokenData.userId !== null
        ? String(tokenData.userId)
        : ''
    const members = Array.isArray(project?.members)
        ? project?.members
        : []
    const isProjectManager = !!members?.some(member => (
        String(member.userId) === userId
        && normalizeValue(member.role) === PROJECT_ROLES.MANAGER
    ))

    return hasAdminRole(roles)
        || hasManagerRole(roles)
        || hasTaskManagerRole(roles)
        || isProjectManager
}

export function checkIsCopilotOrManager(
    members: ProjectMember[],
    handle: string,
): boolean {
    const normalizedHandle = normalizeValue(handle)

    if (!normalizedHandle || !Array.isArray(members)) {
        return false
    }

    const memberRole = members.find(member => normalizeValue(member.handle) === normalizedHandle)?.role
    const normalizedRole = normalizeValue(memberRole)

    return normalizedRole === 'copilot' || normalizedRole === 'manager'
}

export function checkIsUserInvitedToProject(
    token: string,
    project: Project,
): ProjectInvite | undefined {
    const tokenData = getTokenData(token)
    const invites = Array.isArray(project.invites)
        ? project.invites
        : []

    return invites.find(invite => {
        const inviteUserId = typeof invite.userId === 'number'
            ? invite.userId
            : undefined
        const inviteEmail = normalizeValue(invite.email)
        const inviteHandle = normalizeValue(invite.handle)

        return (
            (tokenData.userId !== undefined && inviteUserId === Number(tokenData.userId))
            || (!!tokenData.email && inviteEmail === normalizeValue(tokenData.email))
            || (!!tokenData.handle && inviteHandle === normalizeValue(tokenData.handle))
        )
    })
}

export function getResourceRoleByName(resourceRoles: ResourceRole[], name: string): ResourceRole | undefined {
    if (name === 'Submitter') {
        return resourceRoles.find(role => role.id === SUBMITTER_ROLE_UUID)
    }

    return resourceRoles.find(role => role.name === name)
}

export async function checkChallengeEditPermission(
    challengeId: string,
    {
        hasProjectAccess = true,
        loggedInUserId,
        token,
    }: CheckChallengeEditPermissionOptions,
): Promise<boolean> {
    if (checkIsAdmin(token)) {
        return true
    }

    if (!hasProjectAccess) {
        return false
    }

    const tokenData = getTokenData(token)
    const resolvedUserId = loggedInUserId !== undefined && loggedInUserId !== null
        ? String(loggedInUserId)
        : (
            tokenData.userId !== undefined && tokenData.userId !== null
                ? String(tokenData.userId)
                : ''
        )

    if (!resolvedUserId) {
        return false
    }

    try {
        const [challengeResources, resourceRoles] = await Promise.all([
            fetchResources(challengeId),
            fetchResourceRoles(),
        ])
        const userRoles = challengeResources.filter(resource => (
            String(resource.memberId) === resolvedUserId
        ))
        const userRoleIds = new Set(userRoles.map(role => role.roleId))

        return resourceRoles.some(resourceRole => (
            userRoleIds.has(resourceRole.id)
            && resourceRole.fullWriteAccess === true
            && resourceRole.isActive !== false
        ))
    } catch {
        return false
    }
}

export function hasReadOnlyRole(token: string): boolean {
    const roles = getTokenRoles(token)

    if (checkAllowedRoles(roles)) {
        return false
    }

    return hasRole(roles, READ_ONLY_ROLES)
}

export function canEditResourceByRoleName(roleName: string): boolean {
    const normalizedRoleName = normalizeValue(roleName)

    return ALLOWED_EDIT_RESOURCE_ROLES.some(role => {
        const normalizedAllowedRole = normalizeValue(role)

        return normalizedRoleName.includes(normalizedAllowedRole)
    })
}
