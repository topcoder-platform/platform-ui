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
        const matchedRole = ['Submitter', 'Reviewer', 'Copilot', 'Admin'].find(
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

    return {
        actionChallengeRole,
        myChallengeResources: myResources,
        myChallengeRoles: displayRoles,
    }
}

export { useRole }
