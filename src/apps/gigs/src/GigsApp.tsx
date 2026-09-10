import { FC, useContext, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'
import { ToolTitle } from '~/config'

import './styles/index.scss'

/** Hosts the public Gigs routes and scopes the shared 2026 design system to their content. */
const GigsApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(ToolTitle.gigs), [getChildRoutes])
    return (
        <div className='gigs-app tc-2026'>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </div>
    )
}

export default GigsApp
