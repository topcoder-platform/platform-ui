/** Root application shell for Support. */
import {
    FC,
    useContext,
    useEffect,
    useMemo,
} from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { Layout } from './lib/components'
import { toolTitle } from './support-app.routes'
import './lib/styles/index.scss'

/**
 * Renders the Support layout and the active child route.
 *
 * @returns the Support application shell.
 * @throws Does not throw.
 */
const SupportApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    useEffect(() => {
        document.body.classList.add('support-app')
        return () => document.body.classList.remove('support-app')
    }, [])

    return (
        <Layout>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </Layout>
    )
}

export default SupportApp
