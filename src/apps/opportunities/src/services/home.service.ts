import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { ApiEnvelope, ChallengeOpportunity } from '../models'
import {
    filterHomeChallenges,
    HOME_CHALLENGE_FEED_SIZE,
    HOME_CHALLENGE_TYPES,
    HOME_EXCLUDED_CHALLENGE_TAGS,
} from '../utils/home.utils'

/**
 * Challenges requested before tag exclusion. Community-app omitted `perPage`
 * whenever it excluded tags, so Challenge API applied its default page of 20.
 */
export const HOME_CHALLENGE_REQUEST_SIZE: number = 20

/**
 * Builds the Challenge API v6 query used by the member home "Opportunities" feed.
 *
 * Mirrors community-app's dashboard `ChallengesFeed`: active Challenge,
 * First2Finish, and Marathon Match challenges whose current phase is
 * Registration, most recently updated first, using the lightweight projection.
 * Types use the bracketed `types[]` key because Challenge API only coerces
 * bracketed keys into arrays.
 *
 * @returns absolute `/v6/challenges` URL.
 * @throws Does not throw.
 */
export function buildHomeChallengeFeedUrl(): string {
    const url = new URL(`${EnvironmentConfig.API.V6}/challenges`)
    url.searchParams.set('page', '1')
    url.searchParams.set('perPage', String(HOME_CHALLENGE_REQUEST_SIZE))
    HOME_CHALLENGE_TYPES.forEach(type => url.searchParams.append('types[]', type))
    url.searchParams.set('status', 'ACTIVE')
    url.searchParams.set('currentPhaseName', 'Registration')
    url.searchParams.set('sortBy', 'updated')
    url.searchParams.set('sortOrder', 'desc')
    url.searchParams.set('isLightweight', 'true')
    return url.toString()
}

/**
 * Loads the challenges shown on the member home page.
 *
 * Used by `useHomeChallengeFeed`. Challenges tagged `Innovation Challenge`
 * are removed client-side (Challenge API has no tag exclusion filter) before
 * the list is limited to five, as community-app did.
 *
 * @returns up to five open-for-registration challenges in API order.
 * @throws Propagates Challenge API and network errors so the caller can show a retry state.
 */
export async function getHomeChallengeFeed(): Promise<ChallengeOpportunity[]> {
    const response = await xhrGetAsync<ChallengeOpportunity[] | ApiEnvelope<ChallengeOpportunity[]>>(
        buildHomeChallengeFeedUrl(),
    )
    const envelope = response as ApiEnvelope<ChallengeOpportunity[]>
    const challenges = Array.isArray(response)
        ? response
        : envelope.result?.content ?? envelope.content ?? []
    return filterHomeChallenges(
        Array.isArray(challenges) ? challenges : [],
        HOME_EXCLUDED_CHALLENGE_TAGS,
        HOME_CHALLENGE_FEED_SIZE,
    )
}
