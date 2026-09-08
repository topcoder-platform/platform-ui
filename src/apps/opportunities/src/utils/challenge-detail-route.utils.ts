/** Tabs exposed by the replacement challenge-details route. */
export const CHALLENGE_DETAIL_TABS = [
    'requirements',
    'registrants',
    'submissions',
    'mine',
    'dashboard',
    'forum',
    'winners',
] as const

/** Stable query-string identifiers accepted by challenge details. */
export type ChallengeDetailTab = typeof CHALLENGE_DETAIL_TABS[number]

/**
 * Builds an internal challenge-details URL for a specific tab.
 *
 * Requirements remains the query-free canonical route; every other tab uses
 * the legacy-compatible `tab` query parameter.
 *
 * @param challengeId Challenge API identifier.
 * @param tab optional destination tab.
 * @returns encoded challenge-details path with the requested tab.
 * @throws Does not throw.
 */
export function challengeDetailPath(
    challengeId: string,
    tab: ChallengeDetailTab = 'requirements',
): string {
    const path = `/opportunities/challenge/${encodeURIComponent(challengeId)}`
    return tab === 'requirements' ? path : `${path}?tab=${tab}`
}

/**
 * Parses a challenge-details tab from URL search parameters.
 *
 * @param searchParams current route query parameters.
 * @returns a supported tab identifier, or undefined for an absent/unknown value.
 * @throws Does not throw.
 */
export function challengeDetailTabFromSearch(
    searchParams: URLSearchParams,
): ChallengeDetailTab | undefined {
    const requested = searchParams.get('tab')
        ?.trim()
        .toLowerCase()
    return CHALLENGE_DETAIL_TABS.find(tab => tab === requested)
}
