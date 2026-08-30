/** Authenticated read-only client for the AWS analytics API. */
import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import {
    AnalyticsFilterOptions,
    CampaignFilters,
    CampaignReport,
    GeneralFilters,
    GeneralReport,
} from '../models'

export const ANALYTICS_API_BASE = EnvironmentConfig.ANALYTICS.API_URL.replace(/\/$/, '')

type AnalyticsQueryValues = Partial<CampaignFilters & GeneralFilters>

const ANALYTICS_QUERY_KEYS: Array<keyof AnalyticsQueryValues> = [
    'from',
    'to',
    'campaign',
    'campaignId',
    'source',
    'medium',
    'surface',
]

/**
 * Builds an analytics API URL from an allowlisted path and scalar filters.
 *
 * @param path API path relative to the configured analytics base.
 * @param values allowlisted scalar filters.
 * @returns absolute URL with encoded query values.
 * @throws Error when the analytics API has not been configured for the environment.
 */
export function buildAnalyticsUrl(
    path: string,
    values: AnalyticsQueryValues = {},
): string {
    if (!ANALYTICS_API_BASE) {
        throw new Error('Analytics API is not configured for this environment')
    }

    const query = new URLSearchParams()
    ANALYTICS_QUERY_KEYS
        .forEach(key => {
            const value = values[key]
            if (value) query.set(key, value)
        })
    const encodedQuery = query.toString()
    return `${ANALYTICS_API_BASE}/${path}${encodedQuery ? `?${encodedQuery}` : ''}`
}

/**
 * Loads server-approved campaign and surface filter options.
 *
 * @returns filter values plus available data dates.
 * @throws Rejects when configuration, authentication, authorization, or the API request fails.
 */
export function getAnalyticsFilters(): Promise<AnalyticsFilterOptions> {
    return xhrGetAsync(buildAnalyticsUrl('filters'))
}

/**
 * Loads an ordered campaign funnel with click-location detail.
 *
 * @param filters validated UI date and UTM filters.
 * @returns campaign totals, series, and breakdowns.
 * @throws Rejects when configuration, authentication, authorization, or the API request fails.
 */
export function getCampaignReport(filters: CampaignFilters): Promise<CampaignReport> {
    return xhrGetAsync(buildAnalyticsUrl('campaign', filters))
}

/**
 * Loads general Topcoder site engagement analytics.
 *
 * @param filters validated UI date and optional surface filter.
 * @returns general totals, series, and breakdowns.
 * @throws Rejects when configuration, authentication, authorization, or the API request fails.
 */
export function getGeneralReport(filters: GeneralFilters): Promise<GeneralReport> {
    return xhrGetAsync(buildAnalyticsUrl('general', filters))
}
