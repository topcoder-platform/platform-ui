import { useCallback } from 'react'
import qs from 'qs'
import useSWR, { SWRResponse } from 'swr'

import { PaginatedResponse } from '~/libs/core'

import {
    BackendChallengeInfo,
    ChallengeInfo,
    convertBackendChallengeInfo,
} from '../models'
import { ChallengeListParams, fetchChallenges } from '../services'

export interface UseChallengesResult {
    challenges: ChallengeInfo[]
    isLoading: boolean
    total: number
}

/**
 * Fetches community challenges with list filters.
 *
 * @param params Challenge list filters.
 * @returns Converted challenges, total count, and loading status.
 */
export function useChallenges(params: ChallengeListParams): UseChallengesResult {
    const key = `community/challenges/${qs.stringify(params, {
        arrayFormat: 'repeat',
        skipNulls: true,
    })}`
    const fetcher = useCallback(
        () => fetchChallenges(params),
        [params],
    )
    const {
        data,
        isValidating: isLoading,
    }: SWRResponse<PaginatedResponse<BackendChallengeInfo[]>, Error>
        = useSWR<PaginatedResponse<BackendChallengeInfo[]>, Error>(
            key,
            fetcher,
            {
                revalidateOnFocus: false,
                revalidateOnReconnect: false,
            },
        )

    return {
        challenges: (data?.data ?? [])
            .map((challenge, index) => convertBackendChallengeInfo(challenge, index))
            .filter((challenge): challenge is ChallengeInfo => Boolean(challenge)),
        isLoading: !data && isLoading,
        total: data?.total ?? 0,
    }
}
