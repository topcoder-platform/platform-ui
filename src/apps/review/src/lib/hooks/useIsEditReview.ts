import { useContext, useMemo } from 'react'

import { REVIEWER } from '../../config/index.config'
import { ChallengeDetailContextModel } from '../models'
import { ChallengeDetailContext } from '../contexts'
import { isReviewPhase } from '../utils'

import { useRole, useRoleProps } from './useRole'

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
    const { actionChallengeRole }: useRoleProps = useRole()
    const isEdit = useMemo(() => {
        if (
            actionChallengeRole === REVIEWER
            && challengeInfo
            && isReviewPhase(challengeInfo)
        ) {
            return true
        }

        return false
    }, [actionChallengeRole, challengeInfo])

    return {
        isEdit,
    }
}

export { useIsEditReview }
