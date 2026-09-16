import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { SalesQuery, SalesReport } from './sales.models'

/**
 * Reads Salesforce report data through the role-protected Reports API using the user's token.
 * @param query Server-side search, filter, sorting, pagination and refresh options.
 * @param signal Cancels obsolete requests when controls change or the page unmounts.
 * @returns The current report schema and one page of rows.
 * @throws Propagates network, authorization and sanitized Reports API errors.
 */
export function fetchSalesReport(query: SalesQuery, signal?: AbortSignal): Promise<SalesReport> {
    const params = new URLSearchParams()
    Object.entries(query)
        .forEach(([key, value]) => {
            if (value !== undefined && value !== '') params.set(key, String(value))
        })
    return xhrGetAsync<SalesReport>(`${EnvironmentConfig.REPORTS_API}/sales?${params.toString()}`, undefined, {
        signal,
        timeout: 120000,
    })
}

/**
 * Explains report failures without exposing transport internals or upstream responses.
 * @param error Unknown request rejection.
 * @returns User-facing recovery guidance, including explicit authorization failures.
 * @throws Does not throw.
 */
export function salesErrorMessage(error: unknown): string {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 401) return 'Your session has expired. Sign in again to view sales data.'
    if (status === 403) return 'Sales data is available to Administrators and Talent Managers.'
    if (status === 503) return 'The sales connection is not configured yet. Contact your administrator.'
    if (status === 400) return 'The report columns have changed. Clear the filters and sorting, then try again.'
    return 'We could not refresh the Salesforce report. Please try again.'
}
