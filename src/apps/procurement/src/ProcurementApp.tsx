/* eslint-disable react/jsx-no-bind */
/**
 * Shell for the hidden procurement app.
 */
import { FC, useContext, useMemo } from 'react'
import { NavLink, Outlet, Routes } from 'react-router-dom'
import classNames from 'classnames'

import { routerContext, RouterContextData } from '~/libs/core'
import { ContentLayout } from '~/libs/ui'

import {
    buildProcurementPath,
    procurementContractsRoute,
    procurementDashboardRoute,
    procurementInvoicesRoute,
    procurementRenewalsRoute,
    procurementVendorsRoute,
} from './config/routes.config'
import { toolTitle } from './procurement-app.routes'
import styles from './ProcurementApp.module.scss'

interface ProcurementNavigationItem {
    label: string
    route: string
    to: string
}

const navigationItems: ProcurementNavigationItem[] = [
    {
        label: 'Dashboard',
        route: procurementDashboardRoute,
        to: buildProcurementPath(procurementDashboardRoute),
    },
    {
        label: 'Vendors',
        route: procurementVendorsRoute,
        to: buildProcurementPath(procurementVendorsRoute),
    },
    {
        label: 'Contracts',
        route: procurementContractsRoute,
        to: buildProcurementPath(procurementContractsRoute),
    },
    {
        label: 'Invoices',
        route: procurementInvoicesRoute,
        to: buildProcurementPath(procurementInvoicesRoute),
    },
    {
        label: 'Renewals',
        route: procurementRenewalsRoute,
        to: buildProcurementPath(procurementRenewalsRoute),
    },
]

const ProcurementApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    return (
        <ContentLayout
            innerClass={styles.inner}
            outerClass={styles.outer}
            title='Procurement'
        >
            <nav aria-label='Procurement modules' className={styles.navigation}>
                {navigationItems.map((item: ProcurementNavigationItem) => (
                    <NavLink
                        className={({ isActive }: { isActive: boolean }) => classNames(
                            styles.navigationLink,
                            { [styles.active]: isActive },
                        )}
                        end={item.route === procurementDashboardRoute}
                        key={item.route || 'dashboard'}
                        to={item.to}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className={styles.content}>
                <Outlet />
                <Routes>{childRoutes}</Routes>
            </div>
        </ContentLayout>
    )
}

export default ProcurementApp
