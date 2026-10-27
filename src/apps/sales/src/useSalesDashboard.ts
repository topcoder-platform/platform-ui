import { useCallback, useEffect, useState } from 'react'

import {
    fetchSalesDashboard,
    SalesDashboardPortal,
    SalesDashboardResponse,
    SalesDashboardSection,
} from './sales-dashboard.service'

export const dashboardTitles = {
    'gross-margin': 'Gross margin',
    payments: 'Member payments',
    pipeline: 'Sales pipeline',
    revenue: 'Revenue',
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
 * @param dateBasis Selected pipeline date field; other sources always use close.
 * @param refreshKey Increments when the user refreshes all sources.
 * @returns Current response/error and a retry callback; superseded results are ignored.
 * @throws Does not throw; transport errors are exposed as user-facing messages.
 */
export function useSalesDashboard(
    section: SalesDashboardSection,
    portal: SalesDashboardPortal,
    dateBasis: 'close' | 'created',
    refreshKey: number,
): SalesDashboardSource {
    const [data, setData] = useState<SalesDashboardResponse>()
    const [error, setError] = useState<string>()
    const [retryKey, setRetryKey] = useState(0)
    const basis = section === 'pipeline' ? dateBasis : 'close'
    useEffect(() => {
        const controller = new AbortController()
        setData(undefined)
        setError(undefined)
        fetchSalesDashboard(section, portal, basis, controller.signal)
            .then(response => {
                if (!controller.signal.aborted) setData(response)
            })
            .catch(reason => {
                if (controller.signal.aborted) return
                const status = reason?.response?.status
                setError(status === 401 ? 'Your session has expired. Sign in again.'
                    : status === 403 ? 'You do not have access to this report.'
                        : `${dashboardTitles[section]} could not be loaded. Please try again.`)
            })
        return () => controller.abort()
    }, [section, portal, basis, refreshKey, retryKey])
    const retry = useCallback(() => setRetryKey(value => value + 1), [])
    return { data, error, retry }
}
