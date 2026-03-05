/**
 * The reports app.
 */
import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { Layout, ReportsAppContextProvider, SWRConfigProvider } from './lib'
import { toolTitle } from './reports-app.routes'
import './lib/styles/index.scss'

const ReportsApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    useEffect(() => {
        document.body.classList.add('reports-app')
        return () => {
            document.body.classList.remove('reports-app')
        }
    }, [])

    return (
        <ReportsAppContextProvider>
            <SWRConfigProvider>
                <Layout>
                    <Outlet />
                    <Routes>{childRoutes}</Routes>
                </Layout>
            </SWRConfigProvider>
        </ReportsAppContextProvider>
    )
}

export default ReportsApp
