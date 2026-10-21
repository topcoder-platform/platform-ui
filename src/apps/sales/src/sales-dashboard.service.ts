import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

export type SalesDashboardSection = 'pipeline' | 'revenue' | 'payments' | 'talent' | 'gross-margin'
export type SalesDashboardPortal = 'reports' | 'sales'

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
}

/**
 * Loads an independent monthly section using the Reports API and current user's token.
 * @param section Source section to load.
 * @param portal Server-side payment scope; Sales excludes internal and TaaS payments before aggregation.
 * @param dateBasis Date field for pipeline monthly grouping.
 * @param signal Cancels superseded or unmounted requests.
 * @returns Monthly chart definitions and any source limitations.
 * @throws Propagates network and authorization errors for the section's inline retry state.
 */
export function fetchSalesDashboard(
    section: SalesDashboardSection,
    portal: SalesDashboardPortal,
    dateBasis: 'close' | 'created',
    signal: AbortSignal,
): Promise<SalesDashboardResponse> {
    const params = new URLSearchParams({ dateBasis, portal })
    return xhrGetAsync<SalesDashboardResponse>(
        `${EnvironmentConfig.REPORTS_API}/sales-dashboard/${section}?${params.toString()}`,
        undefined,
        { signal, timeout: 120000 },
    )
}
