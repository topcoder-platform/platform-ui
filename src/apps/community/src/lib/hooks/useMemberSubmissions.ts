import { useContext } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { profileContext, ProfileContextData } from '~/libs/core'

import { SubmissionInfo } from '../models'
import { fetchMemberSubmissions } from '../services'

export interface UseMemberSubmissionsResult {
    isLoading: boolean
    submissions: SubmissionInfo[]
}

/**
 * Builds the SWR cache key for member-scoped submissions.
 *
 * @param memberId Member identifier from profile context.
 * @returns Stable SWR key when member id exists, otherwise undefined.
 */
export function getMemberSubmissionsSwrKey(
    memberId?: string,
): string | undefined {
    if (!memberId) {
        return undefined
    }

    return `community/member-submissions/${memberId}`
}

/**
 * Fetches recent submissions for the logged-in member.
 *
 * @returns Member submissions and loading status.
 */
export function useMemberSubmissions(): UseMemberSubmissionsResult {
    const { profile }: ProfileContextData = useContext(profileContext)
    const memberId = profile?.userId
        ? `${profile.userId}`
        : undefined
    const key = getMemberSubmissionsSwrKey(memberId)

    const {
        data: submissions,
        isValidating: isLoading,
    }: SWRResponse<SubmissionInfo[], Error> = useSWR<SubmissionInfo[], Error>(
        key,
        {
            fetcher: () => fetchMemberSubmissions(memberId ?? ''),
        },
    )

    return {
        isLoading,
        submissions: submissions ?? [],
    }
}
