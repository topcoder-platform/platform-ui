import { FC, useContext, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { adminRoutes } from '../../admin-app.routes'
import { platformRouteId } from '../../config/routes.config'
import { platformSkillRouteId } from '../routes.config'

import { SkillsManagerContext } from './lib/context'

/**
 * The router outlet.
 */
export const PlatformManagement: FC = () => {
    const childRoutes = useChildRoutes()

    return (
        <SkillsManagerContext>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </SkillsManagerContext>
    )
}

function useChildRoutes(): Array<JSX.Element> | undefined {
    const { getRouteElement }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(
        () => adminRoutes[0].children
            ?.find(r => r.id === platformRouteId)
            ?.children?.find(r => r.id === platformSkillRouteId)
            ?.children?.map(getRouteElement),
        [], // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: getRouteElement
    )
    return childRoutes
}

export default PlatformManagement
