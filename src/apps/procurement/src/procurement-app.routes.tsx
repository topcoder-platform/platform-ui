/**
 * App routes for the procurement app.
 */
import { AppSubdomain, ToolTitle } from '~/config'
import { lazyLoad, LazyLoadedComponent, PlatformRoute } from '~/libs/core'

import {
    procurementContractsRoute,
    procurementContractsRouteId,
    procurementDashboardRoute,
    procurementDashboardRouteId,
    procurementInvoicesRoute,
    procurementInvoicesRouteId,
    procurementRenewalsRoute,
    procurementRenewalsRouteId,
    procurementVendorsRoute,
    procurementVendorsRouteId,
    rootRoute,
} from './config/routes.config'
import { PROCUREMENT_ALLOWED_ROLES } from './lib/constants/roles.constants'

const ProcurementApp: LazyLoadedComponent = lazyLoad(() => import('./ProcurementApp'))
const ProcurementDashboardPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/dashboard'),
    'ProcurementDashboardPage',
)
const ProcurementContractsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/contracts'),
    'ProcurementContractsPage',
)
const ProcurementInvoicesPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/invoices'),
    'ProcurementInvoicesPage',
)
const ProcurementRenewalsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/renewals'),
    'ProcurementRenewalsPage',
)
const ProcurementVendorsPage: LazyLoadedComponent = lazyLoad(
    () => import('./pages/vendors'),
    'ProcurementVendorsPage',
)

export const toolTitle: string = ToolTitle.procurement

export const procurementRoutes: ReadonlyArray<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                element: <ProcurementDashboardPage />,
                id: procurementDashboardRouteId,
                route: procurementDashboardRoute,
                title: toolTitle,
            },
            {
                element: <ProcurementVendorsPage />,
                id: procurementVendorsRouteId,
                route: procurementVendorsRoute,
                title: 'Vendors',
            },
            {
                element: <ProcurementContractsPage />,
                id: procurementContractsRouteId,
                route: procurementContractsRoute,
                title: 'Contracts',
            },
            {
                element: <ProcurementInvoicesPage />,
                id: procurementInvoicesRouteId,
                route: procurementInvoicesRoute,
                title: 'Invoices',
            },
            {
                element: <ProcurementRenewalsPage />,
                id: procurementRenewalsRouteId,
                route: procurementRenewalsRoute,
                title: 'Renewals',
            },
        ],
        domain: AppSubdomain.procurement,
        element: <ProcurementApp />,
        id: toolTitle,
        rolesRequired: PROCUREMENT_ALLOWED_ROLES,
        route: rootRoute,
        title: toolTitle,
    },
]
