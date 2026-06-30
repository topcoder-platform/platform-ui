/**
 * Common config for routes in procurement app.
 */
import { AppSubdomain, EnvironmentConfig } from '~/config'

export const rootRoute: string
    = EnvironmentConfig.SUBDOMAIN === AppSubdomain.procurement
        ? ''
        : `/${AppSubdomain.procurement}`

export const procurementContractsRouteId = 'procurement-contracts'
export const procurementDashboardRouteId = 'procurement-dashboard'
export const procurementInvoicesRouteId = 'procurement-invoices'
export const procurementRenewalsRouteId = 'procurement-renewals'
export const procurementVendorsRouteId = 'procurement-vendors'

export const procurementDashboardRoute = ''
export const procurementContractsRoute = 'contracts'
export const procurementInvoicesRoute = 'invoices'
export const procurementRenewalsRoute = 'renewals'
export const procurementVendorsRoute = 'vendors'

/**
 * Builds an absolute procurement path from a child route segment.
 *
 * @param route Child route segment from the procurement route map.
 * @returns Absolute path rooted at the configured procurement root route.
 */
export function buildProcurementPath(route: string = procurementDashboardRoute): string {
    const normalizedRoute: string = route.replace(/^\/+/, '')

    if (!normalizedRoute) {
        return rootRoute || '/'
    }

    return `${rootRoute}/${normalizedRoute}`
}
