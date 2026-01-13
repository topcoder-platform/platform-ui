import {
    useEffect,
    useMemo,
} from 'react'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/libs/shared'
import { UserRole } from '~/libs/core'

import { BackendSubmission, BackendSubmissionStatus } from '../models'
import { fetchSubmissions } from '../services'

export interface useFetchChallengeSubmissionsProps {
    challengeSubmissions: BackendSubmission[]
    deletedLegacySubmissionIds: Set<string>
    deletedSubmissionIds: Set<string>
    isLoading: boolean
}

interface ChallengeSubmissionsMemoResult {
    deletedLegacySubmissionIds: Set<string>
    deletedSubmissionIds: Set<string>
    filteredSubmissions: BackendSubmission[]
}

export interface ChallengeSubmissionsViewer {
    roles?: Array<string | undefined | null>
    tokenRoles?: Array<string | undefined | null>
    userId?: string | number | null
}

/**
 * Fetch challenge submissions
 * @param challengeId challenge id
 * @returns challenge submissions
 */
export function useFetchChallengeSubmissions(
    challengeId?: string,
    viewer?: ChallengeSubmissionsViewer,
): useFetchChallengeSubmissionsProps {
    // Use swr hooks for submissions fetching
    const {
        data: challengeSubmissions,
        error,
        isValidating: isLoading,
    }: SWRResponse<BackendSubmission[], Error> = useSWR<
        BackendSubmission[],
        Error
    >(`reviewBaseUrl/submissions/${challengeId}`, {
        fetcher: async () => {
            const results = await fetchSubmissions(1, 100, challengeId ?? '')
            return results
        },
        isPaused: () => !challengeId,
    })

    const normalizedRoles = useMemo<string[]>(
        () => (viewer?.roles ?? [])
            .map(role => (role ? `${role}`.toLowerCase()
                .trim() : ''))
            .filter(Boolean),
        [viewer?.roles],
    )
    const normalizedTokenRoles = useMemo<string[]>(
        () => (viewer?.tokenRoles ?? [])
            .map(role => (typeof role === 'string' ? role.toLowerCase()
                .trim() : ''))
            .filter(Boolean),
        [viewer?.tokenRoles],
    )
    const hasSubmitterRole = useMemo<boolean>(
        () => normalizedRoles.some(role => role.includes('submitter')),
        [normalizedRoles],
    )
    const hasCopilotRole = useMemo<boolean>(
        () => normalizedRoles.some(role => role.includes('copilot')),
        [normalizedRoles],
    )
    const hasReviewerRole = useMemo<boolean>(
        () => normalizedRoles.some(role => role.includes('reviewer')),
        [normalizedRoles],
    )
    const hasManagerRole = useMemo<boolean>(
        () => normalizedRoles.some(role => role.includes('manager')),
        [normalizedRoles],
    )
    const hasScreenerRole = useMemo<boolean>(
        () => normalizedRoles.some(role => role.includes('screener')),
        [normalizedRoles],
    )
    const hasApproverRole = useMemo<boolean>(
        () => normalizedRoles.some(role => role.includes('approver')),
        [normalizedRoles],
    )
    const isProjectManager = useMemo<boolean>(
        () => normalizedTokenRoles.some(
            role => role === UserRole.projectManager.toLowerCase(),
        )
            || normalizedRoles.some(role => role.includes('project manager')),
        [normalizedRoles, normalizedTokenRoles],
    )
    const isAdmin = useMemo<boolean>(
        () => normalizedTokenRoles.some(
            role => role === UserRole.administrator.toLowerCase(),
        )
            || normalizedRoles.some(role => role.includes('admin')),
        [normalizedRoles, normalizedTokenRoles],
    )
    const canViewAllSubmissions = useMemo<boolean>(
        () => (viewer ? (
            isAdmin
                || hasCopilotRole
                || hasReviewerRole
                || hasManagerRole
                || hasScreenerRole
                || hasApproverRole
                || isProjectManager
        ) : true),
        [
            viewer,
            isAdmin,
            hasCopilotRole,
            hasReviewerRole,
            hasManagerRole,
            hasScreenerRole,
            hasApproverRole,
            isProjectManager,
        ],
    )
    const viewerMemberId = useMemo<string | undefined>(
        () => {
            const raw = viewer?.userId
            if (raw === undefined || raw === null) {
                return undefined
            }

            const normalized = `${raw}`.trim()
            return normalized.length ? normalized : undefined
        },
        [viewer?.userId],
    )

    // Show backend error when fetching data fail
    useEffect(() => {
        if (error) {
            handleError(error)
        }
    }, [error])

    const {
        filteredSubmissions,
        deletedLegacySubmissionIds,
        deletedSubmissionIds,
    }: ChallengeSubmissionsMemoResult = useMemo(() => {
        if (!challengeSubmissions?.length) {
            return {
                deletedLegacySubmissionIds: new Set<string>(),
                deletedSubmissionIds: new Set<string>(),
                filteredSubmissions: challengeSubmissions ?? [],
            }
        }

        const normalizedDeletedIds = new Set<string>()
        const normalizedDeletedLegacyIds = new Set<string>()
        const activeSubmissions: BackendSubmission[] = []
        const shouldRestrictToCurrentMember = Boolean(
            hasSubmitterRole
            && !canViewAllSubmissions,
        )

        const normalizeStatus = (status: unknown): string => {
            if (typeof status === 'string') {
                return status.trim()
                    .toUpperCase()
            }

            if (typeof status === 'number') {
                const mapped = BackendSubmissionStatus[status as BackendSubmissionStatus]
                if (mapped) {
                    return `${mapped}`.trim()
                        .toUpperCase()
                }
            }

            return `${status ?? ''}`.trim()
                .toUpperCase()
        }

        challengeSubmissions.forEach(submission => {
            const status = normalizeStatus(submission?.status)
            if (status === 'DELETED') {
                if (submission?.id) {
                    normalizedDeletedIds.add(`${submission.id}`)
                }

                if (submission?.legacySubmissionId) {
                    normalizedDeletedLegacyIds.add(`${submission.legacySubmissionId}`)
                }

                return
            }

            activeSubmissions.push(submission)
        })

        const visibleSubmissions = shouldRestrictToCurrentMember
            ? activeSubmissions.filter(submission => (viewerMemberId
                ? `${submission?.memberId ?? ''}` === viewerMemberId
                : false))
            : activeSubmissions

        return {
            deletedLegacySubmissionIds: normalizedDeletedLegacyIds,
            deletedSubmissionIds: normalizedDeletedIds,
            filteredSubmissions: visibleSubmissions,
        }
    }, [
        challengeSubmissions,
        canViewAllSubmissions,
        hasSubmitterRole,
        viewerMemberId,
    ])

    return {
        challengeSubmissions: filteredSubmissions,
        deletedLegacySubmissionIds,
        deletedSubmissionIds,
        isLoading,
    }
}
