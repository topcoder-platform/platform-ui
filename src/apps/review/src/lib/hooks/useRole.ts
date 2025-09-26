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

        const myRole = myRoles.join(', ')

        return (['Submitter', 'Reviewer', 'Copilot', 'Admin'].find(
            item => myRole.toLowerCase()
                .indexOf(item.toLowerCase()) >= 0,
        ) ?? '') as ChallengeRole
    }, [challengeId, myRoles])

    return {
        actionChallengeRole,
        myChallengeResources: myResources,
        myChallengeRoles: displayRoles,
    }
}

export { useRole }
