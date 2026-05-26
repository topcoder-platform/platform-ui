import { FC, useContext, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { adminRoutes } from '../admin-app.routes'
import { aiRouteId } from '../config/routes.config'

export const Ai: FC = () => {
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
            ?.find(r => r.id === aiRouteId)
            ?.children?.map(getRouteElement),
        [], // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: getRouteElement
    )
    return childRoutes
}

export default Ai
