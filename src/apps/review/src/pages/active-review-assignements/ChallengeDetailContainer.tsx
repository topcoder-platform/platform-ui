/**
 * The router outlet.
 */

import { FC, PropsWithChildren, useContext, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { reviewRoutes } from '../../review-app.routes'
import { activeReviewAssigmentsRouteId, challengeDetailRouteId } from '../../config/routes.config'
import { ChallengeDetailContextProvider } from '../../lib'

export const ChallengeDetailContainer: FC<PropsWithChildren> = () => {
    const childRoutes = useChildRoutes()

    return (
        <ChallengeDetailContextProvider>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </ChallengeDetailContextProvider>
    )
}

/**
 * Get child routes of challenge detail page
 * @returns child routes
 */
function useChildRoutes(): Array<JSX.Element> | undefined {
    const { getRouteElement }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(
        () => reviewRoutes[0].children
            ?.find(r => r.id === activeReviewAssigmentsRouteId)
            ?.children?.find(r => r.id === challengeDetailRouteId)
            ?.children?.map(getRouteElement),
        [getRouteElement],
    )
    return childRoutes
}

export default ChallengeDetailContainer
