/**
 * Root application shell for administrator operational status views.
 */
import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { Layout } from './lib/components'
import { toolTitle } from './status-app.routes'
import './lib/styles/index.scss'

/**
 * Renders the Status navigation, layout, and lazily active child route.
 *
 * @returns the Status application shell.
 * @throws Does not throw.
 */
const StatusApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    useEffect(() => {
        document.body.classList.add('status-app')
        return () => {
            document.body.classList.remove('status-app')
        }
    }, [])

    return (
        <Layout>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </Layout>
    )
}

export default StatusApp
