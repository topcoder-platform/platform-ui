import { useContext, useMemo } from 'react'

import { REVIEWER } from '../../config/index.config'
import { ChallengeDetailContextModel } from '../models'
import { ChallengeDetailContext } from '../contexts'
import { isReviewPhase } from '../utils'

import { getRoleForContext, useRole, useRoleProps } from './useRole'

/**
 * Manage readonly/edit mode in review
 */
export interface useIsEditReviewProps {
    isEdit: boolean
}

/**
 * Manage readonly/edit mode in review
 * @returns is edit
 */
const useIsEditReview = (): useIsEditReviewProps => {
    const { challengeInfo }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const { actionChallengeRole, hasReviewerRole }: useRoleProps = useRole()

    const reviewContextRole = useMemo(
        () => getRoleForContext('review', { actionChallengeRole, hasReviewerRole }),
        [actionChallengeRole, hasReviewerRole],
    )
    const isEdit = useMemo(() => {
        if (
            reviewContextRole === REVIEWER
            && challengeInfo
            && isReviewPhase(challengeInfo)
        ) {
            return true
        }

        return false
    }, [challengeInfo, reviewContextRole])

    return {
        isEdit,
    }
}

export { useIsEditReview }
