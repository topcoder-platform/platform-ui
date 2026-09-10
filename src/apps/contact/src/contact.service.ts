/** Authenticated transport for the Contact API. All authorization and send checks also run server-side. */
import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync, xhrPatchAsync, xhrPostAsync } from '~/libs/core'

import { MemberIdentity } from './contact.models'

export const CONTACT_API_BASE = EnvironmentConfig.CONTACT_API.replace(/\/$/, '')

/**
 * Reads an admin resource from the configured Contact API using the shared authenticated client.
 * @param path relative API path, with encoded identifiers and optional query parameters.
 * @returns the typed response document.
 * @throws Rejects on network, authentication, authorization, or API validation errors.
 */
export function contactGet<T>(path: string): Promise<T> {
    return xhrGetAsync<T>(`${CONTACT_API_BASE}/${path}`)
}

/**
 * Resolves an exact handle or email to an active member for human-facing Contact lookup forms.
 * @param query handle or email; surrounding whitespace is removed and numeric values remain handles.
 * @returns the canonical member identity for subsequent preferences or personalized-preview requests.
 * @throws Rejects for blank input, unavailable/unknown members, ambiguous email, or transport/auth failures.
 */
export async function contactLookupMember(query: string): Promise<MemberIdentity> {
    const value = query.trim()
    if (!value) throw new Error('Enter a Topcoder handle or email address.')
    return contactGet<MemberIdentity>(`members/lookup?query=${encodeURIComponent(value)}`)
}

/**
 * Creates a Contact resource or invokes an action using the signed-in administrator's token.
 * @param path relative action/resource path.
 * @param body action input validated again by the API.
 * @returns the typed API response.
 * @throws Rejects on network, authorization, validation, or concurrency failures.
 */
export function contactPost<T>(path: string, body: unknown): Promise<T> {
    return xhrPostAsync<unknown, T>(`${CONTACT_API_BASE}/${path}`, body)
}

/**
 * Updates a Contact resource through the authenticated API.
 * @param path relative resource path with encoded identifiers.
 * @param body changed resource fields.
 * @returns the persisted resource document.
 * @throws Rejects on network, authorization, validation, or concurrency failures.
 */
export function contactPatch<T>(path: string, body: unknown): Promise<T> {
    return xhrPatchAsync<unknown, T>(`${CONTACT_API_BASE}/${path}`, body)
}

/**
 * Deletes a Contact resource using the signed-in administrator's token.
 * @param path relative resource path with encoded identifiers.
 * @returns completion after the API confirms deletion, including an empty 204 response.
 * @throws Rejects on network, authorization, missing-resource, or API validation failures.
 */
export function contactDelete(path: string): Promise<void> {
    return xhrDeleteAsync<void>(`${CONTACT_API_BASE}/${path}`)
}

/**
 * Extracts a readable API error for action status messages.
 * @param error unknown thrown request failure.
 * @returns server validation text or a general request failure message.
 * @throws Does not throw.
 */
export function contactError(error: unknown): string {
    const candidate = error as { message?: string; response?: { data?: { message?: string | string[] } } }
    const message = candidate?.response?.data?.message
    return (
        (Array.isArray(message) ? message.join('; ') : message)
        || candidate?.message
        || 'The request failed. Please try again.'
    )
}
