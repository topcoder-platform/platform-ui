import { useContext, useMemo } from 'react'

import { UserRole } from '~/libs/core'

import {
    ChallengeDetailContext,
    ReviewAppContext,
} from '../contexts'
import type {
    ChallengeDetailContextModel,
    ChallengeRole,
    ReviewAppContextModel,
} from '../models'

import type { useRoleProps } from './useRole'
import { useRole } from './useRole'

export interface UseRolePermissionsResult {
    actionChallengeRole: ChallengeRole
    canManageCompletedReviews: boolean
    canViewAllSubmissions: boolean
    hasCopilotRole: boolean
    hasReviewerRole: boolean
    hasSubmitterRole: boolean
    isAdmin: boolean
    isProjectManager: boolean
    isCopilotWithReviewerAssignments: boolean
    ownedMemberIds: Set<string>
}

/**
 * Computes role-derived permissions shared across review table components.
 */
export function useRolePermissions(): UseRolePermissionsResult {
    const { myResources, myRoles }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)

    const {
        actionChallengeRole,
        hasReviewerRole,
        hasApproverRole,
        hasScreenerRole,
        hasManagerRole,
        isCopilotWithReviewerAssignments,
    }: useRoleProps = useRole()

    const normalizedRoles = useMemo<string[]>(
        () => myRoles.map(role => role.toLowerCase()),
        [myRoles],
    )

    const hasCopilotRole = useMemo<boolean>(
        () => normalizedRoles.some(role => role.includes('copilot')),
        [normalizedRoles],
    )

    const hasSubmitterRole = useMemo<boolean>(
        () => normalizedRoles.some(role => role.includes('submitter')),
        [normalizedRoles],
    )

    const isProjectManager = useMemo<boolean>(
        () => (loginUserInfo?.roles?.some(
            role => typeof role === 'string'
                && role.toLowerCase() === UserRole.projectManager,
        ) ?? false)
            || normalizedRoles.some(role => role.includes('project manager')),
        [
            loginUserInfo?.roles,
            normalizedRoles,
        ],
    )

    const isAdmin = useMemo<boolean>(
        () => (loginUserInfo?.roles?.some(
            role => typeof role === 'string'
                && role.toLowerCase() === UserRole.administrator,
        ) ?? false)
            || normalizedRoles.some(role => role.includes('admin')),
        [
            loginUserInfo?.roles,
            normalizedRoles,
        ],
    )

    const ownedMemberIds = useMemo<Set<string>>(
        () => new Set<string>(
            myResources
                .map(resource => resource?.memberId)
                .filter((memberId): memberId is string => Boolean(memberId)),
        ),
        [myResources],
    )

    const canManageCompletedReviews = useMemo<boolean>(
        () => isAdmin || hasCopilotRole,
        [hasCopilotRole, isAdmin],
    )

    const canViewAllSubmissions = useMemo<boolean>(
        () => (
            isAdmin
            || hasCopilotRole
            || hasReviewerRole
            || hasManagerRole
            || hasScreenerRole
            || hasApproverRole
            || isProjectManager
        ),
        [hasCopilotRole, isAdmin, isProjectManager, hasReviewerRole, hasManagerRole, hasScreenerRole, hasApproverRole],
    )

    return {
        actionChallengeRole,
        canManageCompletedReviews,
        canViewAllSubmissions,
        hasCopilotRole,
        hasReviewerRole,
        hasSubmitterRole,
        isAdmin,
        isCopilotWithReviewerAssignments,
        isProjectManager,
        ownedMemberIds,
    }
}
