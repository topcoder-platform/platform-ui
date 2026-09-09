import { EnvironmentConfig } from '~/config'
import { tokenGetAsync } from '~/libs/core'

import { Candidate, Gig } from './models'

const RECRUIT_URL = `${EnvironmentConfig.COMMUNITY_APP_URL}/api/recruit`

/** Returns whether Recruit supplied one of its documented successful application response shapes. */
function isConfirmedApplication(result: unknown): boolean {
    if (!result || typeof result !== 'object' || Array.isArray(result)) return false
    const response = result as Record<string, unknown>
    return response.success === true
        || (response.success === undefined && Object.keys(response).length > 0)
}

/** An API failure with an HTTP-equivalent status, including Recruit errors returned with HTTP 200. */
export class RecruitError extends Error {
    status: number

    /** Creates a public, actionable error from a message and status; used by the Gigs error states. */
    constructor(message: string, status: number) {
        super(message)
        this.status = status
    }
}

/** Fetches JSON from an owned endpoint; authenticated calls refresh the member token and reject API errors. */
async function recruitRequest<T>(
    url: string,
    authenticated: boolean = false,
    body: FormData | undefined = undefined,
): Promise<T> {
    const headers: Record<string, string> = {}
    if (authenticated) {
        const auth = await tokenGetAsync()
        if (!auth.token) throw new RecruitError('Your session has expired. Sign in again to continue.', 401)
        headers.Authorization = `Bearer ${auth.token}`
    }

    const response = await fetch(url, {
        body,
        credentials: 'omit',
        headers,
        method: body ? 'POST' : 'GET',
    })
    const data = await response.json()
        .catch(() => undefined)
    if (!response.ok || !data || data.error) {
        const status = data?.status || response.status
        const message = data?.errorObj?.notAllowed
            ? 'You are already placed on a gig and cannot apply for another. Contact talent.taas@wipro.com for help.'
            : 'We could not complete this request. Please try again.'
        throw new RecruitError(message, status)
    }

    return data as T
}

/** Loads all publicly open jobs from the existing cached Recruit endpoint; rejects malformed responses. */
export async function getGigs(): Promise<Gig[]> {
    const data = await recruitRequest<unknown>(`${RECRUIT_URL}/jobs?job_status=1`)
    if (!Array.isArray(data)) throw new RecruitError('We could not load the gigs. Please try again.', 502)
    return data
}

/** Loads a job by its legacy slug, preserving fulfilled status-only responses; rejects missing jobs. */
export async function getGig(slug: string): Promise<Gig> {
    return recruitRequest<Gig>(`${RECRUIT_URL}/jobs/${encodeURIComponent(slug)}`)
}

/**
 * Looks up the signed-in member's existing candidate profile through Recruit's public search endpoint.
 * Normalizes both its current direct-array response and the older `{ data }` envelope; no match returns
 * undefined, while malformed responses and request failures reject.
 */
export async function getCandidate(email: string): Promise<Candidate | undefined> {
    const result = await recruitRequest<Candidate[] | { data?: Candidate[] }>(
        `${RECRUIT_URL}/candidates/search?email=${encodeURIComponent(email)}`,
    )
    const candidates = Array.isArray(result) ? result : result.data
    if (!Array.isArray(candidates)) throw new RecruitError('We could not load your Gig Work profile.', 502)
    return candidates[0]
}

/**
 * Posts a multipart application with the refreshed member token. Recruit confirms a new assignment with its
 * populated assignment resource, while an already-existing assignment uses the older `{ success: true }` shape.
 */
export async function applyToGig(slug: string, body: FormData): Promise<void> {
    const result = await recruitRequest<unknown>(
        `${RECRUIT_URL}/jobs/${encodeURIComponent(slug)}/apply`,
        true,
        body,
    )
    if (!isConfirmedApplication(result)) {
        throw new RecruitError('Your application was not confirmed. Please try again.', 502)
    }
}

/** Loads an authored candidate policy from the Payload compatibility endpoint; returns its Markdown body. */
export async function getGigPolicy(id: string): Promise<string> {
    const result = await recruitRequest<{ fields?: { content?: { fields?: { text?: string } } } }>(
        `${EnvironmentConfig.COMMUNITY_APP_URL}/api/cdn/public/contentful/default/master/published/entries/${id}`,
    )
    const text = result.fields?.content?.fields?.text
    if (!text) throw new RecruitError('This policy could not be loaded. Please try again.', 502)
    return text
}
