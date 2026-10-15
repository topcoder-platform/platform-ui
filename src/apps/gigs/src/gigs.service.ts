import { EnvironmentConfig } from '~/config'
import { tokenGetAsync } from '~/libs/core'

import { Candidate, Gig } from './models'

const RECRUIT_URL = `${EnvironmentConfig.WEBSITE_API_URL}/recruit`
const CMS_URL = `${EnvironmentConfig.WEBSITE_API_URL}/cms`
const PLACED_CANDIDATE_CODE = 'candidate_placed'

/**
 * Returns whether Recruit supplied an explicit success or an assignment for the requested Gig.
 *
 * @param result Recruit's parsed application response.
 * @param slug The requested Gig slug, which must match a returned assignment resource.
 * @returns Whether the response confirms the application.
 */
function isConfirmedApplication(result: unknown, slug: string): boolean {
    if (!result || typeof result !== 'object' || Array.isArray(result)) return false
    const response = result as Record<string, unknown>
    return response.success === true
        || (
            typeof response.candidate_slug === 'string'
            && response.candidate_slug.trim().length > 0
            && response.job_slug === slug
        )
}

/** An API failure carrying the website API's HTTP status. */
export class RecruitError extends Error {
    status: number

    /** Creates a public, actionable error from a message and status; used by the Gigs error states. */
    constructor(message: string, status: number) {
        super(message)
        this.status = status
    }
}

/**
 * Fetches JSON from the website runtime API.
 *
 * @param url Absolute website API URL.
 * @param authenticated Whether to refresh and send the member token; a missing token rejects with 401.
 * @param body Optional multipart body; its presence makes the request a POST.
 * @returns The parsed JSON payload.
 * @throws RecruitError with the HTTP status for failed or unparsable responses, using the placed-candidate
 * message when the API reports `code: candidate_placed`.
 */
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
    if (!response.ok || !data) {
        const message = data?.code === PLACED_CANDIDATE_CODE
            ? 'You are already placed on a gig and cannot apply for another. Contact talent.taas@wipro.com for help.'
            : 'We could not complete this request. Please try again.'
        throw new RecruitError(message, response.ok ? 502 : response.status)
    }

    return data as T
}

/** Loads all publicly open jobs from the website API's cached Recruit listing; rejects malformed responses. */
export async function getGigs(): Promise<Gig[]> {
    const data = await recruitRequest<unknown>(`${RECRUIT_URL}/jobs`)
    if (!Array.isArray(data)) throw new RecruitError('We could not load the gigs. Please try again.', 502)
    return data
}

/** Loads a job by its legacy slug, preserving fulfilled status-only responses; rejects missing jobs. */
export async function getGig(slug: string): Promise<Gig> {
    return recruitRequest<Gig>(`${RECRUIT_URL}/jobs/${encodeURIComponent(slug)}`)
}

/**
 * Loads the signed-in member's existing Recruit candidate profile.
 *
 * The website API searches only the email in the member's verified token, so no email is sent.
 *
 * @returns The candidate, or undefined when the member has no profile yet.
 * @throws RecruitError for expired sessions, request failures, and malformed responses.
 */
export async function getCandidate(): Promise<Candidate | undefined> {
    const result = await recruitRequest<{ candidate?: Candidate | null }>(`${RECRUIT_URL}/candidate`, true)
    if (!result || typeof result !== 'object' || !('candidate' in result)) {
        throw new RecruitError('We could not load your Gig Work profile.', 502)
    }

    return result.candidate || undefined
}

/**
 * Posts a multipart application with the refreshed member token.
 *
 * @param slug Recruit job slug; the confirmation must name the same job.
 * @param body Multipart body with the `form` JSON part and an optional `resume` file.
 * @returns Resolves once the website API confirms the assignment (`success: true`, including an existing
 * assignment, or the matching `candidate_slug`/`job_slug` pair).
 * @throws RecruitError for expired sessions, already placed candidates (409), rejected identities or files,
 * Recruit failures, and unconfirmed responses.
 */
export async function applyToGig(slug: string, body: FormData): Promise<void> {
    const result = await recruitRequest<unknown>(
        `${RECRUIT_URL}/jobs/${encodeURIComponent(slug)}/apply`,
        true,
        body,
    )
    if (!isConfirmedApplication(result, slug)) {
        throw new RecruitError('Your application was not confirmed. Please try again.', 502)
    }
}

/** Loads an authored candidate policy from the website API's published CMS proxy; returns its Markdown body. */
export async function getGigPolicy(id: string): Promise<string> {
    const result = await recruitRequest<{ fields?: { content?: { fields?: { text?: string } } } }>(
        `${CMS_URL}/default/entries/${encodeURIComponent(id)}`,
    )
    const text = result.fields?.content?.fields?.text
    if (!text) throw new RecruitError('This policy could not be loaded. Please try again.', 502)
    return text
}
