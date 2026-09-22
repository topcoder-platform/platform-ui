import { xhrGetAsync } from '~/libs/core'

import { PROJECTS_API_URL } from '../constants'

export interface SalesforceOpportunity {
    id: string
    name: string
    description?: string
    /** Subcontracting End Customer account name. */
    customer?: string
    /** Reporting SMU already mapped onto a supported SMU option. */
    smu?: string
    /** Raw Reporting SMU, populated only when `smu` is `Others`. */
    smuOther?: string
    reportingSmu?: string
    /** Close Date as a YYYY-MM-DD calendar date. */
    closeDate?: string
    stageName?: string
    /** Deep link to the opportunity record in Salesforce. */
    url: string
}

/**
 * Reads a Salesforce opportunity through the role-protected Projects API.
 * @param opportunityId 15 or 18 character Salesforce opportunity id.
 * @param signal Cancels an obsolete lookup when the input changes or the form unmounts.
 * @returns The opportunity fields used to populate project details.
 * @throws Propagates network, authorization and sanitized Projects API errors.
 */
export function fetchSalesforceOpportunity(
    opportunityId: string,
    signal?: AbortSignal,
): Promise<SalesforceOpportunity> {
    const url = `${PROJECTS_API_URL}/salesforce/opportunities/${encodeURIComponent(opportunityId)}`
    return xhrGetAsync<SalesforceOpportunity>(url, undefined, { signal })
}

/**
 * Explains an opportunity lookup failure without exposing transport internals.
 * @param error Unknown request rejection.
 * @returns User-facing recovery guidance for the inline field error.
 * @throws Does not throw.
 */
export function salesforceOpportunityErrorMessage(error: unknown): string {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 400) return 'Enter a valid 15 or 18 character Salesforce Opportunity ID.'
    if (status === 401) return 'Your session has expired. Sign in again to look up the opportunity.'
    if (status === 403) return 'You do not have permission to read Salesforce opportunities.'
    if (status === 404) return 'No Salesforce opportunity was found for that ID.'
    if (status === 503) return 'The Salesforce connection is not configured yet. Contact your administrator.'
    return 'We could not reach Salesforce. Please try again.'
}
