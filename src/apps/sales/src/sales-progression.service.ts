import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

/** Applied history-event calendar dates and exact stage filters. */
export interface SalesProgressionQuery {
    dateFrom: string
    dateTo: string
    fromStage?: string
    toStage?: string
}

/** Counts are distinct within a stage pair; the same opportunity may appear in several pairs. */
export interface SalesTransition {
    fromStage: string
    toStage: string
    opportunities: number
    transitions: number
}

/** Complete Salesforce summaries, independent of the report detail-row limit. */
export interface SalesProgressionReport extends SalesProgressionQuery {
    timeZone: string
    stages: string[]
    openStages: string[]
    wonStages: string[]
    progressed: { opportunities: number; transitions: number; breakdown: SalesTransition[] }
    won: { opportunities: number; transitions: number; breakdown: SalesTransition[] }
    refreshedAt: string
    refreshAfterSeconds: number
}

/**
 * Loads historical summaries through the human-role-protected Reports API.
 * @param query Period and stage filters. @param signal Cancels obsolete requests.
 * @returns Complete forward and won totals calculated in Salesforce.
 * @throws Propagates transport and sanitized API errors.
 */
export function fetchSalesProgression(
    query: SalesProgressionQuery,
    signal?: AbortSignal,
): Promise<SalesProgressionReport> {
    const params = new URLSearchParams()
    Object.entries(query)
        .forEach(([key, value]) => {
            if (value) params.set(key, value)
        })
    return xhrGetAsync<SalesProgressionReport>(
        `${EnvironmentConfig.REPORTS_API}/sales/progression?${params.toString()}`,
        undefined,
        { signal, timeout: 120000 },
    )
}

/** @param error Unknown request failure. @returns Actionable user-facing message. Does not throw. */
export function progressionErrorMessage(error: unknown): string {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 401) return 'Your session has expired. Sign in again to view sales data.'
    if (status === 403) return 'Sales data is available to Administrators and Talent Managers.'
    if (status === 400) return 'Check the dates and stage filters. The period can cover up to 366 days.'
    if (status === 503) {
        return 'Stage progression is unavailable. Try again shortly or ask your administrator to check report setup.'
    }

    return 'We could not load complete stage progression data. Please try again.'
}
