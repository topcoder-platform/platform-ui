import { FC, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { toolTitle } from './arena-manager.routes'
import './lib/styles/index.scss'

/**
 * Root component for the Arena Manager micro-app.
 */
const ArenaManagerApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [])

    useEffect(() => {
        document.body.classList.add('arena-manager-app')
        return () => {
            document.body.classList.remove('arena-manager-app')
        }
    }, [])

    return (
        <div>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </div>
    )
}

export default ArenaManagerApp
