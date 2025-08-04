/**
 * Manage user role
 */
import { useContext, useMemo } from 'react'

import {
    BackendResource,
    ChallengeDetailContextModel,
    ChallengeRole,
} from '../models'
import { ChallengeDetailContext } from '../contexts'

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

    // Get role for review flow
    const actionChallengeRole = useMemo<ChallengeRole>(() => {
        if (!challengeId) {
            return ''
        }

        const myRole = myRoles.join(', ')

        return (['Submitter', 'Reviewer', 'Copilot', 'Admin'].find(
            item => myRole.toLowerCase()
                .indexOf(item.toLowerCase()) >= 0,
        ) ?? 'Submitter') as ChallengeRole
    }, [challengeId, myRoles])

    return {
        actionChallengeRole,
        myChallengeResources: myResources,
        myChallengeRoles: myRoles,
    }
}

export { useRole }
