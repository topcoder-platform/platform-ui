import { EnvironmentConfig } from '~/config'
import { tokenGetAsync } from '~/libs/core'

import { Candidate, Gig } from './models'

const RECRUIT_URL = `${EnvironmentConfig.COMMUNITY_APP_URL}/api/recruit`

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

/** Looks up the signed-in member's existing candidate profile; no match returns undefined, failures reject. */
export async function getCandidate(email: string): Promise<Candidate | undefined> {
    const result = await recruitRequest<{ data: Candidate[] }>(
        `${RECRUIT_URL}/candidates/search?email=${encodeURIComponent(email)}`,
        true,
    )
    if (!Array.isArray(result.data)) throw new RecruitError('We could not load your Gig Work profile.', 502)
    return result.data[0]
}

/** Posts a multipart application with the refreshed member token; resolves only on confirmed success. */
export async function applyToGig(slug: string, body: FormData): Promise<void> {
    const result = await recruitRequest<{ success?: boolean }>(
        `${RECRUIT_URL}/jobs/${encodeURIComponent(slug)}/apply`,
        true,
        body,
    )
    if (!result.success) throw new RecruitError('Your application was not confirmed. Please try again.', 502)
}

/** Reads the member's total from the existing My Gigs API; rejects failures rather than inventing a count. */
export async function getApplicationCount(): Promise<number> {
    const auth = await tokenGetAsync()
    if (!auth.token) throw new RecruitError('Sign in to view your applications.', 401)
    const response = await fetch(
        `https://platform.${EnvironmentConfig.TC_DOMAIN}/gigs-app/api/my-gigs/myJobApplications?page=1&perPage=1`,
        { credentials: 'omit', headers: { Authorization: `Bearer ${auth.token}` } },
    )
    if (!response.ok) throw new RecruitError('We could not load your application count.', response.status)
    const total = response.headers.get('x-total')
    if (total === null || !/^\d+$/.test(total)) throw new RecruitError('Application count is unavailable.', 502)
    return Number(total)
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
