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
    hasApproverRole: boolean
    hasPostMortemReviewerRole: boolean
    checkpointScreenerResourceIds: Set<string>
    checkpointReviewerResourceIds: Set<string>
    copilotReviewerResourceIds: Set<string>
    screenerResourceIds: Set<string>
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

    // Get role for review flow
    const actionChallengeRole = useMemo<ChallengeRole>(() => {
        if (!challengeId) {
            return ''
        }

        const normalizedRoles = myRoles.map(role => role.toLowerCase())
        const matchedRole = ['Submitter', 'Copilot', 'Manager', 'Admin', 'Reviewer'].find(
            item => normalizedRoles.some(role => role.includes(item.toLowerCase())),
        ) as ChallengeRole | undefined

        if (matchedRole) {
            return matchedRole
        }

        if (isTopcoderAdmin) {
            return 'Admin'
        }

        return ''
    }, [challengeId, isTopcoderAdmin, myRoles])

    const isCopilot = useMemo(
        () => actionChallengeRole === 'Copilot',
        [actionChallengeRole],
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
        hasScreenerRole,
        isCopilotWithReviewerAssignments,
        isPrivilegedRole,
        myChallengeResources: myResources,
        myChallengeRoles: displayRoles,
        postMortemReviewerResourceIds,
        screenerResourceIds,
    }
}

export { useRole }
