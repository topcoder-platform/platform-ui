import {
    useEffect,
    useMemo,
} from 'react'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/libs/shared'

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

/**
 * Fetch challenge submissions
 * @param challengeId challenge id
 * @returns challenge submissions
 */
export function useFetchChallengeSubmissions(
    challengeId?: string,
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

        return {
            deletedLegacySubmissionIds: normalizedDeletedLegacyIds,
            deletedSubmissionIds: normalizedDeletedIds,
            filteredSubmissions: activeSubmissions,
        }
    }, [challengeSubmissions])

    return {
        challengeSubmissions: filteredSubmissions,
        deletedLegacySubmissionIds,
        deletedSubmissionIds,
        isLoading,
    }
}
