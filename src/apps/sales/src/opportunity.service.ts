import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

export interface SalesOpportunity {
    id: string
    name: string
    description?: string
    customer?: string
    smu?: string
    reportingSmu?: string
    closeDate?: string
    stageName?: string
    url: string
}

/**
 * Reads a Salesforce opportunity through the role-protected Projects API.
 * @param opportunityId Salesforce opportunity id taken from a report cell.
 * @param signal Cancels the request when the popup closes or another row is opened.
 * @returns The opportunity details shown in the popup.
 * @throws Propagates network, authorization and sanitized Projects API errors.
 */
export function fetchOpportunity(
    opportunityId: string,
    signal?: AbortSignal,
): Promise<SalesOpportunity> {
    const url = `${EnvironmentConfig.API.V6}/projects/salesforce/opportunities/${encodeURIComponent(opportunityId)}`
    return xhrGetAsync<SalesOpportunity>(url, undefined, { signal })
}

/**
 * Explains an opportunity lookup failure without exposing transport internals.
 * @param error Unknown request rejection.
 * @returns User-facing recovery guidance shown inside the popup.
 * @throws Does not throw.
 */
export function opportunityErrorMessage(error: unknown): string {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 401) return 'Your session has expired. Sign in again to view opportunity details.'
    if (status === 403) return 'You do not have permission to read Salesforce opportunities.'
    if (status === 404) return 'This opportunity is no longer available in Salesforce.'
    if (status === 503) return 'The Salesforce connection is not configured yet. Contact your administrator.'
    return 'We could not load the opportunity details. Please try again.'
}
