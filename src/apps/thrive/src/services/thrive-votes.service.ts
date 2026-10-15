import { EnvironmentConfig } from '~/config'
import { tokenGetAsync } from '~/libs/core'

/** A member's vote on a Thrive article; `null` means no vote. */
export type ThriveVote = 'up' | 'down' | null

/** The member's vote and the article's current totals, as returned by the website API. */
export interface ThriveVoteState {
    downvotes: number
    upvotes: number
    vote: ThriveVote
}

/** A website vote API failure with its HTTP status (0 for network failures). */
export class ThriveVoteError extends Error {
    status: number

    /**
     * Creates a member-facing vote error.
     *
     * @param message member-facing explanation.
     * @param status HTTP status, or 0 when the request did not complete.
     */
    constructor(message: string, status: number) {
        super(message)
        this.status = status
    }
}

/**
 * Builds the website runtime API URL for one article's vote resource.
 *
 * @param articleId Thrive article entry identifier (`sys.id`).
 * @returns absolute `/__api/thrive/articles/:id/vote` URL.
 */
function voteUrl(articleId: string): string {
    return `${EnvironmentConfig.WEBSITE_API_URL}/thrive/articles/${encodeURIComponent(articleId)}/vote`
}

/**
 * Calls the website vote API with the refreshed member token and validates its response.
 *
 * @param articleId Thrive article entry identifier.
 * @param init optional request method and body.
 * @returns the member's vote and the article totals.
 * @throws ThriveVoteError for expired sessions, failed requests, and malformed responses.
 */
async function voteRequest(articleId: string, init: RequestInit = {}): Promise<ThriveVoteState> {
    const auth = await tokenGetAsync()
    if (!auth.token) throw new ThriveVoteError('Sign in to vote on Thrive articles.', 401)
    let response: Response
    try {
        response = await fetch(voteUrl(articleId), {
            ...init,
            credentials: 'omit',
            headers: {
                Authorization: `Bearer ${auth.token}`,
                ...(init.body ? { 'Content-Type': 'application/json' } : {}),
            },
        })
    } catch {
        throw new ThriveVoteError('We could not save your vote. Please try again.', 0)
    }

    const data = await response.json()
        .catch(() => undefined)
    const valid = !!data
        && Number.isFinite(data.upvotes)
        && Number.isFinite(data.downvotes)
        && (data.vote === null || data.vote === 'up' || data.vote === 'down')
    if (!response.ok || !valid) {
        throw new ThriveVoteError('We could not save your vote. Please try again.', response.ok ? 502 : response.status)
    }

    return { downvotes: data.downvotes, upvotes: data.upvotes, vote: data.vote }
}

/**
 * Loads the signed-in member's vote and the current totals for a Thrive article.
 *
 * @param articleId Thrive article entry identifier.
 * @returns vote state used by `ThriveVoteButtons`.
 * @throws ThriveVoteError when the member is signed out or the request fails.
 */
export function getThriveVote(articleId: string): Promise<ThriveVoteState> {
    return voteRequest(articleId)
}

/**
 * Records, changes, or clears the signed-in member's vote on a Thrive article.
 *
 * @param articleId Thrive article entry identifier.
 * @param vote `'up'`, `'down'`, or `'none'` to remove the member's vote (sent as JSON `null`).
 * @returns the stored vote and the republished totals.
 * @throws ThriveVoteError when the member is signed out or the request fails.
 */
export function castThriveVote(articleId: string, vote: 'up' | 'down' | 'none'): Promise<ThriveVoteState> {
    // eslint-disable-next-line unicorn/no-null -- the website API contract clears a vote with JSON null.
    const body = JSON.stringify({ vote: vote === 'none' ? null : vote })
    return voteRequest(articleId, { body, method: 'POST' })
}
