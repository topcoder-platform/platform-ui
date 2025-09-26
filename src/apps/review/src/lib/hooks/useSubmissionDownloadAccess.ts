import { useContext, useMemo } from 'react'

import { UserRole } from '~/libs/core'

import {
    ChallengeDetailContextModel,
    ReviewAppContextModel,
} from '../models'
import { ChallengeDetailContext, ReviewAppContext } from '../contexts'

export const SUBMISSION_DOWNLOAD_RESTRICTION_MESSAGE
    = 'Submissions are available once the submission phase closes.'

export interface UseSubmissionDownloadAccessResult {
    isSubmissionPhaseOpen: boolean
    isSubmissionDownloadRestricted: boolean
    restrictionMessage: string
}

function normaliseRole(role: string | undefined): string | undefined {
    return role?.toLowerCase()
}

export function useSubmissionDownloadAccess(): UseSubmissionDownloadAccessResult {
    const {
        challengeInfo,
        myRoles,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)

    const normalisedRoles = useMemo(
        () => (myRoles ?? [])
            .map(normaliseRole)
            .filter((role): role is string => Boolean(role)),
        [myRoles],
    )

    const isSubmissionPhaseOpen = useMemo(
        () => challengeInfo?.phases?.some(
            phase => phase.name?.toLowerCase() === 'submission' && phase.isOpen,
        ) ?? false,
        [challengeInfo?.phases],
    )

    const hasReviewerRole = useMemo(
        () => normalisedRoles.some(role => role.includes('reviewer')),
        [normalisedRoles],
    )

    const hasCopilotRole = useMemo(
        () => normalisedRoles.some(role => role.includes('copilot')),
        [normalisedRoles],
    )

    const isAdmin = useMemo(
        () => loginUserInfo?.roles?.some(
            role => typeof role === 'string'
                && role.toLowerCase() === UserRole.administrator,
        ) ?? false,
        [loginUserInfo?.roles],
    )

    const isSubmissionDownloadRestricted = useMemo(
        () => isSubmissionPhaseOpen
            && hasReviewerRole
            && !(hasCopilotRole || isAdmin),
        [isSubmissionPhaseOpen, hasReviewerRole, hasCopilotRole, isAdmin],
    )

    return {
        isSubmissionDownloadRestricted,
        isSubmissionPhaseOpen,
        restrictionMessage: SUBMISSION_DOWNLOAD_RESTRICTION_MESSAGE,
    }
}
