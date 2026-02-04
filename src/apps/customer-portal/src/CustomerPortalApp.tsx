/**
 * The customer portal app.
 */
import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { CustomerPortalAppContextProvider, Layout, SWRConfigProvider } from './lib'
import { toolTitle } from './customer-portal.routes'
import './lib/styles/index.scss'

const CustomerPortalApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    useEffect(() => {
        document.body.classList.add('customer-portal-app')
        return () => {
            document.body.classList.remove('customer-portal-app')
        }
    }, [])

    return (
        <CustomerPortalAppContextProvider>
            <SWRConfigProvider>
                <Layout>
                    <Outlet />
                    <Routes>{childRoutes}</Routes>
                </Layout>
            </SWRConfigProvider>
        </CustomerPortalAppContextProvider>

    )
}

export default CustomerPortalApp
