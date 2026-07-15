import useSWR, { SWRResponse } from 'swr'

import { Challenge, fetchChallenge } from '~/apps/work/src/lib'

export type UseFetchChallenges = SWRResponse<Challenge[], Error>

export const useFetchChallenges = (challengeIds: string[]): UseFetchChallenges => {
    const shouldFetchChallenges = challengeIds.length > 0

    return useSWR<Challenge[], Error>(
        shouldFetchChallenges ? ['work/challenge-list', challengeIds.join(',')] : undefined,
        async () => {
            const settledResults = await Promise.allSettled(
                challengeIds.map(id => fetchChallenge(id)),
            )

            const loadedChallenges = settledResults
                .filter(
                    (result): result is PromiseFulfilledResult<Challenge> => result.status === 'fulfilled',
                )
                .map(result => result.value)

            if (loadedChallenges.length === 0 && settledResults.length > 0) {
                const rejection = settledResults.find(
                    (result): result is PromiseRejectedResult => result.status === 'rejected',
                )
                throw rejection?.reason ?? new Error('Failed to load challenges')
            }

            return loadedChallenges
        },
        {
            dedupingInterval: 0,
            errorRetryCount: 2,
            shouldRetryOnError: true,
        },
    )
}
