import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { toolTitle } from './opportunities.routes'
import './styles/index.scss'

/**
 * Hosts nested Opportunities routes and scopes the 2026 design system to this app.
 *
 * @returns the active child page and its nested Router elements.
 * @throws Does not throw.
 */
const OpportunitiesApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    useEffect(() => {
        document.body.classList.add('opportunities-app', 'tc-2026')
        return () => document.body.classList.remove('opportunities-app', 'tc-2026')
    }, [])

    return (
        <>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </>
    )
}

export default OpportunitiesApp
