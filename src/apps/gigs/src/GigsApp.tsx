import { FC, useContext, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'
import { ToolTitle } from '~/config'

import './styles/index.scss'

/**
 * Hosts public Gigs routes inside the container for their app-specific styles.
 *
 * @returns The active child page and nested routes.
 * @throws Does not throw.
 */
const GigsApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(ToolTitle.gigs), [getChildRoutes])
    return (
        <div className='gigs-app'>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </div>
    )
}

export default GigsApp
