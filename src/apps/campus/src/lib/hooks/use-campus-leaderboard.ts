import useSWR, { SWRResponse } from 'swr'

import { CampusChallengeFilter, CampusLeaderboard } from '../models'
import { campusLeaderboardUrl, fetchCampusLeaderboard } from '../services'

export interface CampusLeaderboardResource {
    data?: CampusLeaderboard
    error?: Error & { response?: { status?: number } }
    isLoading: boolean
}

/**
 * Loads the campus leaderboard for a group, re-fetching when the filter changes.
 *
 * @param groupName group name from the route, when available.
 * @param challengeFilter selected challenge visibility filter.
 * @returns leaderboard resource state.
 */
export function useCampusLeaderboard(
    groupName: string | undefined,
    challengeFilter: CampusChallengeFilter,
): CampusLeaderboardResource {
    const url: string | undefined = groupName
        ? campusLeaderboardUrl(groupName, challengeFilter)
        : undefined

    const { data, error }: SWRResponse<CampusLeaderboard, Error> = useSWR(
        url,
        fetchCampusLeaderboard,
        { revalidateOnFocus: false },
    )

    return {
        data,
        error,
        isLoading: !!url && !data && !error,
    }
}
