import { useContext, useMemo } from 'react'

import { UserRole } from '~/libs/core'

import {
    ChallengeDetailContext,
    ReviewAppContext,
} from '../contexts'
import type {
    ChallengeDetailContextModel,
    ReviewAppContextModel,
} from '../models'
import { useRole } from './useRole'

/**
 * Computes role-derived permissions shared across review table components.
 */
export function useRolePermissions() {
    const { myResources, myRoles }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)

    const { actionChallengeRole } = useRole()

    const normalizedRoles = useMemo(
        () => myRoles.map(role => role.toLowerCase()),
        [myRoles],
    )

    const hasReviewerRole = useMemo(
        () => normalizedRoles.some(role => role.includes('reviewer')),
        [normalizedRoles],
    )

    const hasCopilotRole = useMemo(
        () => normalizedRoles.some(role => role.includes('copilot')),
        [normalizedRoles],
    )

    const hasSubmitterRole = useMemo(
        () => normalizedRoles.some(role => role.includes('submitter')),
        [normalizedRoles],
    )

    const isAdmin = useMemo(
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

    const ownedMemberIds = useMemo(
        () => new Set(
            myResources
                .map(resource => resource?.memberId)
                .filter((memberId): memberId is string => Boolean(memberId)),
        ),
        [myResources],
    )

    const canManageCompletedReviews = useMemo(
        () => isAdmin || hasCopilotRole,
        [hasCopilotRole, isAdmin],
    )

    return {
        actionChallengeRole,
        canManageCompletedReviews,
        hasCopilotRole,
        hasReviewerRole,
        hasSubmitterRole,
        isAdmin,
        ownedMemberIds,
    }
}
