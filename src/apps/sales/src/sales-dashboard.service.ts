import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { salesFiscalYear } from './sales-fiscal-year'

export type SalesDashboardSection =
    'bookings' | 'pipeline' | 'revenue' | 'payments' | 'taas-payments' | 'talent' | 'gross-margin'
export type SalesDashboardPortal = 'reports' | 'sales'

/** Category selections are matched before server-side aggregation. Empty arrays mean ALL. */
export interface SalesDashboardFilters {
    offeringType?: string[]
    dealCategory?: string[]
    customerType?: string[]
}

export type SalesDashboardFilterOptions = Required<SalesDashboardFilters>

/** One monthly API chart. Undefined markup is represented as null by the API. */
export interface MonthlySalesChart {
    id: string
    title: string
    description: string
    unit: 'currency' | 'count' | 'percent'
    stacked: boolean
    series: Array<{ key: string; label: string }>
    months: Array<{ month: string; values: Record<string, number | null> }>
}

export interface SalesDashboardResponse {
    charts: MonthlySalesChart[]
    notices: string[]
    filterOptions?: SalesDashboardFilterOptions
    /** Every customer before top-five/Other grouping, used for the monthly payments matrix. */
    customerPayments?: MonthlySalesChart
    /** Every customer from the revenue report, without grouping smaller customers into Other. */
    customerRevenue?: MonthlySalesChart
}

/**
 * Loads an independent monthly section for the current April–March fiscal year in UTC.
 * Explicit inclusive/exclusive bounds override the Reports API's rolling month defaults
 * for every chart, including pipeline forecasts. The fiscal year is resolved on each request.
 * @param section Source section to load.
 * @param portal Server-side scope; Sales excludes internal payments and talent assignments before aggregation.
 * @param dateBasis Date field for pipeline monthly grouping.
 * @param signal Cancels superseded or unmounted requests.
 * @param filters Independent card categories; repeated values use OR, fields combine with AND.
 * @returns Monthly chart definitions and any source limitations.
 * @throws Propagates network and authorization errors for the section's inline retry state.
 */
export function fetchSalesDashboard(
    section: SalesDashboardSection,
    portal: SalesDashboardPortal,
    dateBasis: 'close' | 'created',
    signal: AbortSignal,
    filters: SalesDashboardFilters = {},
): Promise<SalesDashboardResponse> {
    const fiscalYear = salesFiscalYear() - 1
    const params = new URLSearchParams({
        dateBasis,
        endDate: new Date(Date.UTC(fiscalYear + 1, 3, 1))
            .toISOString(),
        portal,
        startDate: new Date(Date.UTC(fiscalYear, 3, 1))
            .toISOString(),
    })
    Object.entries(filters)
        .forEach(([key, values]) => {
            values?.forEach((value: string) => params.append(key, value))
        })
    return xhrGetAsync<SalesDashboardResponse>(
        `${EnvironmentConfig.REPORTS_API}/sales-dashboard/${section}?${params.toString()}`,
        undefined,
        { signal, timeout: 120000 },
    )
}
