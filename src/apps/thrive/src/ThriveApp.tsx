import type { FC } from 'react'
import { useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import type { RouterContextData } from '~/libs/core'
import { routerContext } from '~/libs/core'

import { toolTitle } from './thrive.routes'

/**
 * Hosts Thrive's nested routes and applies a scoped body class while the sub-application is active.
 *
 * @returns the active Thrive route.
 * @throws Does not throw.
 */
const ThriveApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    useEffect(() => {
        document.body.classList.add('thrive-app')
        return () => document.body.classList.remove('thrive-app')
    }, [])

    return (
        <>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </>
    )
}

export default ThriveApp
