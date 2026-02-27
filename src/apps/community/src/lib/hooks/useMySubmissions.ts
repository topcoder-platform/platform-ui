import { useContext } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { profileContext, ProfileContextData } from '~/libs/core'

import { SubmissionInfo } from '../models'
import { fetchMySubmissions } from '../services'

export interface UseMySubmissionsResult {
    isLoading: boolean
    submissions: SubmissionInfo[]
}

/**
 * Builds the SWR cache key for member submissions in a challenge.
 *
 * @param challengeId Challenge identifier from route context.
 * @param memberId Current member identifier from profile context.
 * @returns Stable cache key when both inputs are present, otherwise undefined to pause SWR.
 * @remarks Used by both `useMySubmissions` and submission delete invalidation to keep cache scope aligned.
 */
export function getMySubmissionsSwrKey(
    challengeId?: string,
    memberId?: string,
): string | undefined {
    if (!challengeId || !memberId) {
        return undefined
    }

    return `community/my-submissions/${challengeId}/${memberId}`
}

/**
 * Fetches submissions for the current user and selected challenge.
 *
 * @param challengeId Optional challenge identifier.
 * @returns Member submissions and loading status.
 */
export function useMySubmissions(challengeId?: string): UseMySubmissionsResult {
    const { profile }: ProfileContextData = useContext(profileContext)
    const memberId = profile?.userId
        ? `${profile.userId}`
        : undefined
    const key = getMySubmissionsSwrKey(challengeId, memberId)

    const {
        data: submissions,
        isValidating: isLoading,
    }: SWRResponse<SubmissionInfo[], Error> = useSWR<SubmissionInfo[], Error>(
        key,
        {
            fetcher: () => fetchMySubmissions(challengeId ?? '', memberId ?? ''),
        },
    )

    return {
        isLoading,
        submissions: submissions ?? [],
    }
}
