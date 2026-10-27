import { useCallback, useEffect, useState } from 'react'

import {
    fetchSalesDashboard,
    SalesDashboardFilterOptions,
    SalesDashboardFilters,
    SalesDashboardPortal,
    SalesDashboardResponse,
    SalesDashboardSection,
} from './sales-dashboard.service'

export const dashboardTitles = {
    bookings: 'Bookings won',
    'gross-margin': 'Gross margin',
    payments: 'Member payments',
    pipeline: 'Sales pipeline',
    revenue: 'Revenue',
    'taas-payments': 'TaaS payments',
    talent: 'Flexible talent',
}

/** One independent source, shared by its charts and the bottom customer tables. */
export interface SalesDashboardSource {
    data?: SalesDashboardResponse
    error?: string
    filterOptions?: SalesDashboardFilterOptions
    retry: () => void
}

/**
 * Loads a source once for both its charts and customer matrix, with independent retry/cancellation.
 * @param section API source to load.
 * @param portal Customer scope applied by the API.
 * @param dateBasis Selected pipeline date field; other sources always use close.
 * @param refreshKey Increments when the user refreshes all sources.
 * @param filters Card-specific categories; changes cancel superseded requests.
 * @param enabled False reuses an unfiltered source without issuing a duplicate request.
 * @returns Current response/error and a retry callback; superseded results are ignored.
 * @throws Does not throw; transport errors are exposed as user-facing messages.
 */
export function useSalesDashboard(
    section: SalesDashboardSection,
    portal: SalesDashboardPortal,
    dateBasis: 'close' | 'created',
    refreshKey: number,
    filters: SalesDashboardFilters = {},
    enabled: boolean = true,
): SalesDashboardSource {
    const [data, setData] = useState<SalesDashboardResponse>()
    const [filterOptions, setFilterOptions] = useState<SalesDashboardFilterOptions>()
    const filterKey = JSON.stringify(filters)
    const [error, setError] = useState<string>()
    const [retryKey, setRetryKey] = useState(0)
    const basis = ['pipeline', 'bookings'].includes(section) ? dateBasis : 'close'
    useEffect(() => {
        if (!enabled) return undefined
        const controller = new AbortController()
        setData(undefined)
        setError(undefined)
        const selected = JSON.parse(filterKey) as SalesDashboardFilters
        const request = Object.keys(selected).length
            ? fetchSalesDashboard(section, portal, basis, controller.signal, selected)
            : fetchSalesDashboard(section, portal, basis, controller.signal)
        request
            .then(response => {
                if (!controller.signal.aborted) {
                    setData(response)
                    setFilterOptions(response.filterOptions)
                }
            })
            .catch(reason => {
                if (controller.signal.aborted) return
                const status = reason?.response?.status
                setError(status === 401 ? 'Your session has expired. Sign in again.'
                    : status === 403 ? 'You do not have access to this report.'
                        : `${dashboardTitles[section]} could not be loaded. Please try again.`)
            })
        return () => controller.abort()
    }, [section, portal, basis, refreshKey, retryKey, filterKey, enabled])
    const retry = useCallback(() => setRetryKey(value => value + 1), [])
    return { data, error, filterOptions, retry }
}
