/**
 * The router outlet for past review assignments.
 */

import { FC, PropsWithChildren, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes, useLocation } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { reviewRoutes } from '../../review-app.routes'
import { pastReviewAssignmentsRouteId } from '../../config/routes.config'

export const PastReviewAssignments: FC<PropsWithChildren> = () => {
    const location = useLocation()
    const childRoutes = useChildRoutes()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [location.pathname])

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
        () => reviewRoutes[0].children
            ?.find(r => r.id === pastReviewAssignmentsRouteId)
            ?.children?.map(getRouteElement),
        [getRouteElement],
    )
    return childRoutes
}

export default PastReviewAssignments
