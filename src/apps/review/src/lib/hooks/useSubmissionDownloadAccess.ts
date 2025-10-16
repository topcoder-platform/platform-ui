import { useContext, useMemo } from 'react'

import { UserRole } from '~/libs/core'

import {
    ChallengeDetailContextModel,
    ReviewAppContextModel,
} from '../models'
import { ChallengeDetailContext, ReviewAppContext } from '../contexts'

export const SUBMISSION_DOWNLOAD_RESTRICTION_MESSAGE
    = 'Submissions are available once the submission phase closes.'
export const SUBMISSION_DOWNLOAD_SUBMITTER_RESTRICTION_MESSAGE
    = 'You can download only your own submissions until the challenge completes or fails review.'

export interface UseSubmissionDownloadAccessResult {
    isSubmissionPhaseOpen: boolean
    isSubmissionDownloadRestricted: boolean
    restrictionMessage: string
    isSubmissionDownloadRestrictedForMember: (memberId?: string) => boolean
    getRestrictionMessageForMember: (memberId?: string) => string | undefined
    shouldRestrictSubmitterToOwnSubmission: boolean
    currentMemberId?: string
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

    const challengeStatus = challengeInfo?.status?.toLowerCase()
    const isChallengeClosedForDownload = ['completed', 'cancelled_failed_review']
        .includes(challengeStatus ?? '')

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

    const hasIterativeReviewerRole = useMemo(
        () => normalisedRoles.some(role => role.includes('iterative reviewer')),
        [normalisedRoles],
    )

    const hasCopilotRole = useMemo(
        () => normalisedRoles.some(role => role.includes('copilot')),
        [normalisedRoles],
    )

    const hasSubmitterRole = useMemo(
        () => normalisedRoles.some(role => role.includes('submitter')),
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
            && !hasIterativeReviewerRole
            && !(hasCopilotRole || isAdmin),
        [
            isSubmissionPhaseOpen,
            hasReviewerRole,
            hasIterativeReviewerRole,
            hasCopilotRole,
            isAdmin,
        ],
    )

    const shouldRestrictSubmitterToOwnSubmission = useMemo(
        () => hasSubmitterRole
            && !(hasCopilotRole || isAdmin)
            && !isChallengeClosedForDownload
            && !hasIterativeReviewerRole,
        [
            hasSubmitterRole,
            hasCopilotRole,
            isAdmin,
            isChallengeClosedForDownload,
            hasIterativeReviewerRole,
        ],
    )

    const currentMemberId = useMemo(
        () => {
            const userId = loginUserInfo?.userId

            if (typeof userId === 'string' || typeof userId === 'number') {
                return String(userId)
            }

            return undefined
        },
        [loginUserInfo?.userId],
    )

    const isSubmissionDownloadRestrictedForMember = useMemo(
        () => (memberId?: string) => {
            if (isSubmissionDownloadRestricted) {
                return true
            }

            if (!shouldRestrictSubmitterToOwnSubmission) {
                return false
            }

            if (!memberId) {
                return true
            }

            return String(memberId) !== currentMemberId
        },
        [
            isSubmissionDownloadRestricted,
            shouldRestrictSubmitterToOwnSubmission,
            currentMemberId,
        ],
    )

    const getRestrictionMessageForMember = useMemo(
        () => (memberId?: string) => {
            if (isSubmissionDownloadRestricted) {
                return SUBMISSION_DOWNLOAD_RESTRICTION_MESSAGE
            }

            if (!shouldRestrictSubmitterToOwnSubmission) {
                return undefined
            }

            if (!memberId || String(memberId) !== currentMemberId) {
                return SUBMISSION_DOWNLOAD_SUBMITTER_RESTRICTION_MESSAGE
            }

            return undefined
        },
        [
            isSubmissionDownloadRestricted,
            shouldRestrictSubmitterToOwnSubmission,
            currentMemberId,
        ],
    )

    return {
        currentMemberId,
        getRestrictionMessageForMember,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        isSubmissionPhaseOpen,
        restrictionMessage: SUBMISSION_DOWNLOAD_RESTRICTION_MESSAGE,
        shouldRestrictSubmitterToOwnSubmission,
    }
}
