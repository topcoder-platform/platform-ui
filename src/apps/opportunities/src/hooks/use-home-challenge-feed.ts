import { useMemo } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { ChallengeOpportunity } from '../models'
import { getHomeChallengeFeed, getMemberChallengeRegistrationIds } from '../services'

/** SWR key for the member home challenge feed. */
export const HOME_CHALLENGE_FEED_KEY: string = 'opportunities:home-challenge-feed'

/** State returned by `useHomeChallengeFeed`. */
export interface HomeChallengeFeedState {
    /** Up to five open-for-registration challenges; empty while loading or after an error. */
    challenges: ChallengeOpportunity[]
    /** Challenge API failure, when the feed could not be loaded. */
    error?: Error
    /** True until the first feed response or failure. */
    loading: boolean
    /** IDs of challenges the member is registered for as a Submitter. */
    registeredIds: ReadonlySet<string>
    /** Requests the feed again after a failure. */
    retry: () => void
}

/**
 * Loads the member home "Opportunities" feed and the member's challenge registrations.
 *
 * Used by `HomeChallengesFeed`. The registration request reuses the
 * Opportunities listing's SWR key, so moving between Home and Browse
 * Competitions shares one cached response. It is skipped until a member ID is
 * available.
 *
 * @param memberId authenticated member's user ID, or undefined while the profile loads.
 * @returns feed items, registration IDs, loading and error state, and a retry callback.
 * @throws Does not throw; request failures are returned in state. A failed
 * registration lookup leaves every card in its unregistered state.
 */
export function useHomeChallengeFeed(memberId?: string): HomeChallengeFeedState {
    const feed: SWRResponse<ChallengeOpportunity[], Error> = useSWR(
        HOME_CHALLENGE_FEED_KEY,
        getHomeChallengeFeed,
        { revalidateOnFocus: false },
    )
    const registrations: SWRResponse<string[], Error> = useSWR(
        memberId ? ['opportunities:competition-registration-ids', memberId] : undefined,
        () => getMemberChallengeRegistrationIds(memberId as string),
        { revalidateOnFocus: false },
    )
    const registeredIds = useMemo(
        () => new Set(registrations.data ?? []),
        [registrations.data],
    )

    return {
        challenges: feed.data ?? [],
        error: feed.error,
        loading: !feed.data && !feed.error,
        registeredIds,
        retry: () => {
            feed.mutate()
                .catch(() => undefined)
        },
    }
}
