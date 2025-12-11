import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { Layout, LeaveTrackerContextProvider, SWRConfigProvider } from './lib'
import { toolTitle } from './leave-tracker-app.routes'
import './lib/styles/index.scss'

const LeaveTrackerApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    useEffect(() => {
        document.body.classList.add('leave-tracker-app')
        return () => {
            document.body.classList.remove('leave-tracker-app')
        }
    }, [])

    return (
        <LeaveTrackerContextProvider>
            <SWRConfigProvider>
                <Layout>
                    <Outlet />
                    <Routes>{childRoutes}</Routes>
                </Layout>
            </SWRConfigProvider>
        </LeaveTrackerContextProvider>
    )
}

export default LeaveTrackerApp
