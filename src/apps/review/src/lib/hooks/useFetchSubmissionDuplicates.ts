import { useMemo } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { SubmissionDuplicate, SubmissionDuplicatesMap } from '../models'
import {
    fetchMemberHandles,
    fetchSubmissionDuplicates,
    getSubmissionDuplicatesCacheKey,
} from '../services'

export interface UseFetchSubmissionDuplicatesResult {
    duplicatesBySubmissionId: SubmissionDuplicatesMap
    isLoading: boolean
}

const EMPTY_DUPLICATES: SubmissionDuplicatesMap = {}

/**
 * Resolves member handles for the members behind the duplicate submissions.
 * @param duplicatesBySubmissionId Duplicate matches keyed by checked submission id.
 * @returns The same map with `userHandle` filled in wherever a handle resolved.
 */
async function withMemberHandles(
    duplicatesBySubmissionId: SubmissionDuplicatesMap,
): Promise<SubmissionDuplicatesMap> {
    const memberIds = Array.from(new Set(
        Object.values(duplicatesBySubmissionId)
            .flat()
            .map(duplicate => duplicate.user)
            .filter((memberId): memberId is string => !!memberId && /^\d+$/.test(memberId)),
    ))

    if (!memberIds.length) {
        return duplicatesBySubmissionId
    }

    let handlesByMemberId: Map<number, string>
    try {
        handlesByMemberId = await fetchMemberHandles(memberIds)
    } catch {
        return duplicatesBySubmissionId
    }

    return Object.entries(duplicatesBySubmissionId)
        .reduce<SubmissionDuplicatesMap>((result, [submissionId, duplicates]) => {
            result[submissionId] = duplicates.map((duplicate: SubmissionDuplicate) => {
                const handle = duplicate.user
                    ? handlesByMemberId.get(Number(duplicate.user))
                    : undefined

                return handle
                    ? {
                        ...duplicate,
                        userHandle: handle,
                    }
                    : duplicate
            })

            return result
        }, {})
}

/**
 * Fetches SHA-256 duplicate matches for a challenge's submissions.
 *
 * Duplicate detection is an operator-only endpoint, so the caller must gate the
 * request with `enabled`. Failures resolve to an empty map instead of surfacing
 * a toast, because duplicate badges are supplementary to every table they
 * decorate.
 *
 * @param challengeId Challenge that owns the submissions being checked.
 * @param submissionIds Submission ids to check for duplicates.
 * @param enabled Whether the caller is allowed to query duplicates.
 * @returns Duplicate matches keyed by submission id plus the loading flag.
 */
export function useFetchSubmissionDuplicates(
    challengeId?: string,
    submissionIds: string[] = [],
    enabled: boolean = true,
): UseFetchSubmissionDuplicatesResult {
    const normalizedSubmissionIds = useMemo<string[]>(
        () => Array.from(new Set(
            submissionIds
                .map(submissionId => `${submissionId ?? ''}`.trim())
                .filter(Boolean),
        )),
        [submissionIds],
    )

    const cacheKey = enabled
        ? getSubmissionDuplicatesCacheKey(challengeId, normalizedSubmissionIds, true)
        : undefined

    const {
        data: duplicatesBySubmissionId = EMPTY_DUPLICATES,
        isValidating: isLoading,
    }: SWRResponse<SubmissionDuplicatesMap, Error> = useSWR<SubmissionDuplicatesMap, Error>(
        cacheKey,
        {
            fetcher: async (): Promise<SubmissionDuplicatesMap> => {
                if (!challengeId || !normalizedSubmissionIds.length) {
                    return EMPTY_DUPLICATES
                }

                try {
                    const duplicates = await fetchSubmissionDuplicates(
                        challengeId,
                        normalizedSubmissionIds,
                        true,
                    )

                    return withMemberHandles(duplicates)
                } catch {
                    // Duplicate detection is optional context; a denied or failed
                    // lookup must not break the tables it decorates.
                    return EMPTY_DUPLICATES
                }
            },
            isPaused: () => !cacheKey,
            revalidateOnFocus: false,
            shouldRetryOnError: false,
        },
    )

    return {
        duplicatesBySubmissionId,
        isLoading,
    }
}
