import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { salesFiscalYear } from './sales-fiscal-year'

export type SalesDashboardSection =
    'bookings' | 'pipeline' | 'revenue' | 'revenue-forecast' | 'payments' | 'taas-payments' | 'talent' | 'gross-margin'
export type SalesDashboardPortal = 'reports' | 'sales'
export type SalesDashboardPeriod = 'Monthly' | 'Quarterly'
export type SalesAccountCategory = 'External Revenue' | 'Through Wipro' | 'Wipro Internal'
export type SalesRevenueOfferingType =
    'AI Training' | 'Crowd Powered Outcomes' | 'Crowd Powered Innovation' | 'Flexible Talent' | 'TopGear' | 'TaaS Ops'

/** Inclusive calendar dates and offering selections for the goods-sold customer report. */
export interface SalesCustomerPaymentFilters {
    startDate: string
    endDate: string
    offeringType: string[]
}

/** Dimension whose categories become chart series and monthly table columns. */
export type SalesDashboardGroupBy = 'offeringType' | 'dealCategory' | 'customerType' | 'stage' | 'fyClosure'

/** One monthly API chart. Undefined markup is represented as null by the API. */
export interface MonthlySalesChart {
    id: string
    title: string
    description: string
    unit: 'currency' | 'count' | 'percent'
    stacked: boolean
    series: Array<{ key: string; label: string }>
    months: Array<{ month: string; values: Record<string, number | null> }>
    /** Distinct counts calculated from payment events, never sums of monthly counts. */
    quarters?: MonthlySalesChart['months']
    annual?: Record<string, number | null>
}

export interface SalesCustomerRevenue {
    /** Every customer from the revenue report, without grouping smaller customers into Other. */
    customerRevenue?: MonthlySalesChart
    customerRevenueByAccountCategory?: Partial<Record<SalesAccountCategory, MonthlySalesChart>>
}

export interface SalesDashboardResponse extends SalesCustomerRevenue {
    charts: MonthlySalesChart[]
    notices: string[]
    /** Every customer before top-five/Other grouping, used for the monthly payments matrix. */
    customerPayments?: MonthlySalesChart
    /** Same customer/payment scope, with challenge fees added once per payment. */
    customerBookingCosts?: MonthlySalesChart
    filterOptions?: { offeringType: string[] }
    /** Offering-scoped matrices, with account-category intersections calculated from revenue detail rows. */
    customerRevenueByOfferingType?: Partial<Record<SalesRevenueOfferingType, SalesCustomerRevenue>>
}

/**
 * Loads an independent monthly section for the current April–March fiscal year in UTC.
 * Explicit inclusive/exclusive bounds override the Reports API's rolling month defaults
 * for every chart, including pipeline forecasts. The fiscal year is resolved on each request.
 * @param section Source section to load.
 * @param portal Server-side scope; Sales excludes internal payments and talent assignments before aggregation.
 * @param dateBasis Date field for pipeline monthly grouping.
 * @param signal Cancels superseded or unmounted requests.
 * @param groupBy Business breakdown dimension; all category values remain visible.
 * @param customerFilters Inclusive date bounds and offering selections for an independent goods-sold request.
 * @returns Monthly chart definitions and any source limitations.
 * @throws Propagates network and authorization errors for the section's inline retry state.
 */
export function fetchSalesDashboard(
    section: SalesDashboardSection,
    portal: SalesDashboardPortal,
    dateBasis: 'close' | 'created',
    signal: AbortSignal,
    groupBy?: SalesDashboardGroupBy,
    customerFilters?: SalesCustomerPaymentFilters,
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
    if (groupBy) params.set('groupBy', groupBy)
    if (customerFilters) {
        params.set('startDate', `${customerFilters.startDate}T00:00:00.000Z`)
        // The date picker includes the entire To day; the API accepts an exclusive UTC end.
        const exclusiveEnd = new Date(`${customerFilters.endDate}T00:00:00.000Z`)
        exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1)
        params.set('endDate', exclusiveEnd.toISOString())
        customerFilters.offeringType.forEach(offering => params.append('offeringType', offering))
    }

    return xhrGetAsync<SalesDashboardResponse>(
        `${EnvironmentConfig.REPORTS_API}/sales-dashboard/${section}?${params.toString()}`,
        undefined,
        { signal, timeout: 120000 },
    )
}
