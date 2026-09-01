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
type AnalyticsPollWait = (milliseconds: number) => Promise<void>

interface AnalyticsPendingResponse {
    queryToken: string
    retryAfterMs: number
    status: 'pending'
}

const ANALYTICS_MAX_POLL_ATTEMPTS = 12
const ANALYTICS_MAX_POLL_DELAY = 5_000
const ANALYTICS_MIN_POLL_DELAY = 250
const ANALYTICS_QUERY_TOKEN_PATTERN = /^[0-9a-f]{64}$/

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
 * @param queryToken optional server-issued token used to resume a pending warehouse query.
 * @returns absolute URL with encoded query values.
 * @throws Error when the analytics API has not been configured for the environment.
 */
export function buildAnalyticsUrl(
    path: string,
    values: AnalyticsQueryValues = {},
    queryToken: string | undefined = undefined,
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
    query.set('async', 'true')
    if (queryToken) query.set('queryToken', queryToken)
    const encodedQuery = query.toString()
    return `${ANALYTICS_API_BASE}/${path}${encodedQuery ? `?${encodedQuery}` : ''}`
}

/**
 * Waits for the bounded delay requested by a pending analytics response.
 *
 * @param milliseconds server-provided delay clamped by the caller.
 * @returns promise resolved after the delay.
 * @throws Does not throw under normal browser timer operation.
 */
function waitForAnalyticsPoll(milliseconds: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds)
    })
}

/**
 * Checks whether an analytics response is a valid server-issued polling instruction.
 *
 * @param value unknown response body returned by the authenticated API client.
 * @returns true for a bounded pending response containing a reusable SHA-256 token.
 * @throws Does not throw for malformed response values.
 */
function isAnalyticsPendingResponse(value: unknown): value is AnalyticsPendingResponse {
    const candidate = value as Partial<AnalyticsPendingResponse> | undefined
    return candidate?.status === 'pending'
        && typeof candidate.queryToken === 'string'
        && ANALYTICS_QUERY_TOKEN_PATTERN.test(candidate.queryToken)
        && typeof candidate.retryAfterMs === 'number'
        && Number.isFinite(candidate.retryAfterMs)
}

/**
 * Builds a timeout-shaped error compatible with the shared analytics error classifier.
 *
 * @returns error carrying an HTTP-style 504 response after bounded polling is exhausted.
 * @throws Does not throw while constructing the error.
 */
function analyticsPollingTimeout(): Error & { response: { status: number } } {
    return Object.assign(new Error('Analytics warehouse polling limit exceeded'), {
        response: { status: 504 },
    })
}

/**
 * Loads one report and transparently resumes server-side work that outlives an HTTP request.
 *
 * @param path API path relative to the configured analytics base.
 * @param values validated date, UTM, or surface filters.
 * @param wait injectable polling delay used by deterministic tests.
 * @returns completed analytics document after zero or more pending responses.
 * @throws Request failures immediately and a timeout-shaped error after bounded polling.
 */
export async function requestAnalyticsReport<T>(
    path: string,
    values: AnalyticsQueryValues = {},
    wait: AnalyticsPollWait = waitForAnalyticsPoll,
): Promise<T> {
    let queryToken: string | undefined

    for (let attempt = 0; attempt < ANALYTICS_MAX_POLL_ATTEMPTS; attempt += 1) {
        // Polling requests must remain sequential so each response supplies the next token.
        // eslint-disable-next-line no-await-in-loop
        const response = await xhrGetAsync<T | AnalyticsPendingResponse>(
            buildAnalyticsUrl(path, values, queryToken),
        )
        if (!isAnalyticsPendingResponse(response)) return response as T

        queryToken = response.queryToken
        if (attempt + 1 >= ANALYTICS_MAX_POLL_ATTEMPTS) break
        // The server-directed delay is part of the sequential polling protocol.
        // eslint-disable-next-line no-await-in-loop
        await wait(Math.min(
            ANALYTICS_MAX_POLL_DELAY,
            Math.max(ANALYTICS_MIN_POLL_DELAY, response.retryAfterMs),
        ))
    }

    throw analyticsPollingTimeout()
}

/**
 * Loads server-approved campaign and surface filter options.
 *
 * @returns filter values plus available data dates.
 * @throws Rejects when configuration, authentication, authorization, or the API request fails.
 */
export function getAnalyticsFilters(): Promise<AnalyticsFilterOptions> {
    return requestAnalyticsReport('filters')
}

/**
 * Loads an ordered campaign funnel with click-location detail.
 *
 * @param filters validated UI date and UTM filters.
 * @returns campaign totals, series, and breakdowns.
 * @throws Rejects when configuration, authentication, authorization, or the API request fails.
 */
export function getCampaignReport(filters: CampaignFilters): Promise<CampaignReport> {
    return requestAnalyticsReport('campaign', filters)
}

/**
 * Loads general Topcoder site engagement analytics.
 *
 * @param filters validated UI date and optional surface filter.
 * @returns general totals, series, and breakdowns.
 * @throws Rejects when configuration, authentication, authorization, or the API request fails.
 */
export function getGeneralReport(filters: GeneralFilters): Promise<GeneralReport> {
    return requestAnalyticsReport('general', filters)
}
