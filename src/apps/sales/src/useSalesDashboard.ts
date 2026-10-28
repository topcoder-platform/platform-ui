import { useCallback, useEffect, useState } from 'react'

import {
    fetchSalesDashboard,
    SalesDashboardGroupBy,
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
    retry: () => void
}

/**
 * Loads a source once for both its charts and customer matrix, with independent retry/cancellation.
 * @param section API source to load.
 * @param portal Customer scope applied by the API.
 * @param dateBasis Selected bookings/pipeline date field; other sources always use close.
 * @param refreshKey Increments when the user refreshes all sources.
 * @param groupBy Independent card breakdown; changes cancel superseded requests.
 * @returns Current response/error and a retry callback; superseded results are ignored.
 * @throws Does not throw; transport errors are exposed as user-facing messages.
 */
export function useSalesDashboard(
    section: SalesDashboardSection,
    portal: SalesDashboardPortal,
    dateBasis: 'close' | 'created',
    refreshKey: number,
    groupBy?: SalesDashboardGroupBy,
): SalesDashboardSource {
    const [data, setData] = useState<SalesDashboardResponse>()
    const [error, setError] = useState<string>()
    const [retryKey, setRetryKey] = useState(0)
    const basis = ['pipeline', 'bookings'].includes(section) ? dateBasis : 'close'
    useEffect(() => {
        const controller = new AbortController()
        setData(undefined)
        setError(undefined)
        const request = groupBy
            ? fetchSalesDashboard(section, portal, basis, controller.signal, groupBy)
            : fetchSalesDashboard(section, portal, basis, controller.signal)
        request
            .then(response => {
                if (!controller.signal.aborted) {
                    setData(response)
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
    }, [section, portal, basis, refreshKey, retryKey, groupBy])
    const retry = useCallback(() => setRetryKey(value => value + 1), [])
    return { data, error, retry }
}
