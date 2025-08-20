import { FC, useContext, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { adminRoutes } from '../admin-app.routes'
import { platformRouteId } from '../config/routes.config'

/**
 * The router outlet.
 */
export const PlatformManagement: FC = () => {
    const childRoutes = useChildRoutes()

    return (
        <>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </>
    )
}

function useChildRoutes(): Array<JSX.Element> | undefined {
    const { getRouteElement }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(
        () => adminRoutes[0].children
            ?.find(r => r.id === platformRouteId)
            ?.children?.map(getRouteElement),
        [getRouteElement],
    )
    return childRoutes
}

export default PlatformManagement
