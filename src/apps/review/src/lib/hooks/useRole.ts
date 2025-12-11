/**
 * Manage user role
 */
import { useContext, useMemo } from 'react'

import { UserRole } from '~/libs/core'

import {
    BackendResource,
    ChallengeDetailContextModel,
    ChallengeRole,
    ReviewAppContextModel,
} from '../models'
import { ChallengeDetailContext, ReviewAppContext } from '../contexts'

export interface useRoleProps {
    actionChallengeRole: ChallengeRole
    myChallengeRoles: string[]
    myChallengeResources: BackendResource[]
    hasCheckpointScreenerRole: boolean
    hasCheckpointReviewerRole: boolean
    hasScreenerRole: boolean
    /** Indicates the user has at least one reviewer-eligible resource assignment. */
    hasReviewerRole: boolean
    hasApproverRole: boolean
    hasPostMortemReviewerRole: boolean
    checkpointScreenerResourceIds: Set<string>
    checkpointReviewerResourceIds: Set<string>
    copilotReviewerResourceIds: Set<string>
    screenerResourceIds: Set<string>
    reviewerResourceIds: Set<string>
    approverResourceIds: Set<string>
    postMortemReviewerResourceIds: Set<string>
    isCopilotWithReviewerAssignments: boolean
    isPrivilegedRole: boolean
}

/**
 * Manage user role for the current challenge
 * @returns role info
 */
const useRole = (): useRoleProps => {
    const { myResources, myRoles }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const { challengeId }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)

    const isTopcoderAdmin = useMemo(
        () => loginUserInfo?.roles?.some(
            role => typeof role === 'string'
                && role.toLowerCase() === UserRole.administrator,
        ) ?? false,
        [loginUserInfo?.roles],
    )

    const displayRoles = useMemo(
        () => (myRoles.length
            ? myRoles
            : isTopcoderAdmin ? ['Topcoder Admin'] : []),
        [isTopcoderAdmin, myRoles],
    )

    const checkpointScreenerResourceIds = useMemo<Set<string>>(
        () => new Set(
            (myResources ?? [])
                .filter(resource => resource.roleName?.toLowerCase() === 'checkpoint screener')
                .map(resource => resource.id),
        ),
        [myResources],
    )

    const checkpointReviewerResourceIds = useMemo<Set<string>>(
        () => new Set(
            (myResources ?? [])
                .filter(resource => resource.roleName?.toLowerCase() === 'checkpoint reviewer')
                .map(resource => resource.id),
        ),
        [myResources],
    )

    const screenerResourceIds = useMemo<Set<string>>(
        () => new Set(
            (myResources ?? [])
                .filter(resource => {
                    const roleName = resource.roleName?.toLowerCase() ?? ''
                    return roleName.includes('screener') && !roleName.includes('checkpoint')
                })
                .map(resource => resource.id),
        ),
        [myResources],
    )

    const reviewerResourceIds = useMemo<Set<string>>(
        () => new Set(
            (myResources ?? [])
                .filter(resource => {
                    const normalizedRoleName = resource.roleName
                        ?.toLowerCase()
                        .replace(/[^a-z]/g, '') ?? ''
                    return normalizedRoleName === 'reviewer'
                })
                .map(resource => resource.id),
        ),
        [myResources],
    )

    const approverResourceIds = useMemo<Set<string>>(
        () => new Set(
            (myResources ?? [])
                .filter(resource => resource.roleName?.toLowerCase() === 'approver')
                .map(resource => resource.id),
        ),
        [myResources],
    )

    const postMortemReviewerResourceIds = useMemo<Set<string>>(
        () => new Set(
            (myResources ?? [])
                .filter(resource => {
                    const normalizedRoleName = resource.roleName
                        ?.toLowerCase()
                        .replace(/[^a-z]/g, '') ?? ''
                    return normalizedRoleName === 'postmortemreviewer'
                })
                .map(resource => resource.id),
        ),
        [myResources],
    )

    const reviewerLikeResourceIds = useMemo(
        () => {
            const ids = new Set<string>()

            checkpointReviewerResourceIds.forEach(id => ids.add(id))
            checkpointScreenerResourceIds.forEach(id => ids.add(id))
            screenerResourceIds.forEach(id => ids.add(id))
            reviewerResourceIds.forEach(id => ids.add(id))
            approverResourceIds.forEach(id => ids.add(id))
            postMortemReviewerResourceIds.forEach(id => ids.add(id))

            return ids
        },
        [
            approverResourceIds,
            checkpointReviewerResourceIds,
            checkpointScreenerResourceIds,
            postMortemReviewerResourceIds,
            reviewerResourceIds,
            screenerResourceIds,
        ],
    )

    // Get role for review flow
    const actionChallengeRole = useMemo<ChallengeRole>(() => {
        if (!challengeId) {
            return ''
        }

        const normalizedRoles = [
            ...myRoles.map(role => role.toLowerCase()),
            ...(isTopcoderAdmin ? ['admin'] : []),
            ...(reviewerLikeResourceIds.size > 0 ? ['reviewer'] : []),
        ]
        const rolePriority: ChallengeRole[] = [
            'Admin',
            'Manager',
            'Copilot',
            'Reviewer',
            'Submitter',
        ]

        const matchedRole = rolePriority.find(item => (
            normalizedRoles.some(role => role.includes(item.toLowerCase()))
        )) as ChallengeRole | undefined

        if (matchedRole) {
            return matchedRole
        }

        if (isTopcoderAdmin) {
            return 'Admin'
        }

        return ''
    }, [challengeId, isTopcoderAdmin, myRoles, reviewerLikeResourceIds.size])

    const isCopilot = useMemo(
        () => actionChallengeRole === 'Copilot',
        [actionChallengeRole],
    )

    const copilotReviewerResourceIds = useMemo<Set<string>>(
        () => {
            if (!isCopilot) {
                return new Set()
            }

            return new Set(
                (myResources ?? [])
                    .filter(resource => {
                        const roleName = resource.roleName?.toLowerCase() ?? ''
                        return roleName.includes('reviewer') || roleName.includes('approver')
                    })
                    .map(resource => resource.id),
            )
        },
        [isCopilot, myResources],
    )

    const hasCheckpointScreenerRole = useMemo(
        () => checkpointScreenerResourceIds.size > 0,
        [checkpointScreenerResourceIds],
    )

    const hasCheckpointReviewerRole = useMemo(
        () => checkpointReviewerResourceIds.size > 0,
        [checkpointReviewerResourceIds],
    )

    const hasScreenerRole = useMemo(
        () => screenerResourceIds.size > 0,
        [screenerResourceIds],
    )

    const hasReviewerRole = useMemo(
        () => reviewerLikeResourceIds.size > 0,
        [reviewerLikeResourceIds],
    )

    const hasApproverRole = useMemo(
        () => approverResourceIds.size > 0,
        [approverResourceIds],
    )

    const hasPostMortemReviewerRole = useMemo(
        () => postMortemReviewerResourceIds.size > 0,
        [postMortemReviewerResourceIds],
    )

    const isCopilotWithReviewerAssignments = useMemo(
        () => isCopilot && copilotReviewerResourceIds.size > 0,
        [copilotReviewerResourceIds, isCopilot],
    )

    const isPrivilegedRole = useMemo(
        () => ['Admin', 'Copilot', 'Manager'].includes(actionChallengeRole),
        [actionChallengeRole],
    )

    return {
        actionChallengeRole,
        approverResourceIds,
        checkpointReviewerResourceIds,
        checkpointScreenerResourceIds,
        copilotReviewerResourceIds,
        hasApproverRole,
        hasCheckpointReviewerRole,
        hasCheckpointScreenerRole,
        hasPostMortemReviewerRole,
        hasReviewerRole,
        hasScreenerRole,
        isCopilotWithReviewerAssignments,
        isPrivilegedRole,
        myChallengeResources: myResources,
        myChallengeRoles: displayRoles,
        postMortemReviewerResourceIds,
        reviewerResourceIds,
        screenerResourceIds,
    }
}

type ContextRoleSource = Pick<useRoleProps, 'actionChallengeRole' | 'hasReviewerRole'>

/**
 * Determine the effective role for a given context without mutating the action role.
 */
const getRoleForContext = (
    context: string | undefined,
    { actionChallengeRole, hasReviewerRole }: ContextRoleSource,
): ChallengeRole => {
    if (context?.toLowerCase() === 'review' && hasReviewerRole) {
        return 'Reviewer'
    }

    return actionChallengeRole
}

/**
 * Hook wrapper around {@link getRoleForContext}.
 */
const useContextRole = (context?: string): ChallengeRole => {
    const { actionChallengeRole, hasReviewerRole }: ContextRoleSource = useRole()

    return useMemo(
        () => getRoleForContext(context, { actionChallengeRole, hasReviewerRole }),
        [actionChallengeRole, context, hasReviewerRole],
    )
}

export { useRole, getRoleForContext, useContextRole }
