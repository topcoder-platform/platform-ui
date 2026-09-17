/** Root application shell for role-gated product analytics. */
import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { AnalyticsLayout } from './lib/components'
import { toolTitle } from './analytics-app.routes'
import './lib/styles/index.scss'

/**
 * Renders Analytics navigation, layout, and the active child route.
 *
 * @returns Analytics application shell.
 * @throws Does not throw.
 */
const AnalyticsApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    useEffect(() => {
        document.body.classList.add('analytics-app')
        return () => document.body.classList.remove('analytics-app')
    }, [])

    return (
        <AnalyticsLayout>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </AnalyticsLayout>
    )
}

export default AnalyticsApp
