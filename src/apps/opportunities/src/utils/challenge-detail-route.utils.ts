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

/** Query parameter holding the forum topic that a shared Forum tab link opens. */
export const FORUM_TOPIC_QUERY_PARAM = 'topicId'

/** Query parameter holding the forum post that a shared Forum tab link scrolls to. */
export const FORUM_POST_QUERY_PARAM = 'postId'

/** Forum topic, and optionally one of its posts, named in a challenge-details URL. */
export interface ChallengeForumLinkTarget {
    postId?: string
    topicId?: string
}

/**
 * Builds a shareable link to a challenge forum topic or post.
 *
 * The link keeps the host and path of the challenge page the member is on, so
 * TopGear and subdomain deployments link back to the same app. Other query
 * parameters and the hash are dropped, and the link selects the Forum tab.
 *
 * @param pageUrl absolute URL of the current challenge-details page.
 * @param topicId Forums API topic identifier to open.
 * @param postId optional Forums API post identifier to scroll to.
 * @returns absolute link such as `…/challenge/<id>?tab=forum&topicId=<topic>&postId=<post>`.
 * @throws TypeError when `pageUrl` is not an absolute URL.
 */
export function challengeForumLink(pageUrl: string, topicId: string, postId?: string): string {
    const url = new URL(pageUrl)
    url.hash = ''
    url.search = ''
    url.searchParams.set('tab', 'forum')
    url.searchParams.set(FORUM_TOPIC_QUERY_PARAM, topicId)
    if (postId) url.searchParams.set(FORUM_POST_QUERY_PARAM, postId)
    return url.toString()
}

/**
 * Reads the forum topic and post named by challenge-details search parameters.
 *
 * A post without a topic is ignored, because posts load through their topic.
 *
 * @param searchParams current route query parameters.
 * @returns trimmed topic and post identifiers; each is undefined when absent or blank.
 * @throws Does not throw.
 */
export function challengeForumLinkTargetFromSearch(
    searchParams: URLSearchParams,
): ChallengeForumLinkTarget {
    const topicId = searchParams.get(FORUM_TOPIC_QUERY_PARAM)
        ?.trim() || undefined
    const postId = topicId
        ? searchParams.get(FORUM_POST_QUERY_PARAM)
            ?.trim() || undefined
        : undefined
    return { postId, topicId }
}
