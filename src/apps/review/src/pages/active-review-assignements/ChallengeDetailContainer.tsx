/**
 * The router outlet.
 */

import { FC, useContext, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { reviewRoutes } from '../../review-app.routes'
import { activeReviewAssignmentsRouteId, challengeDetailRouteId } from '../../config/routes.config'
import { ChallengeDetailContextProvider } from '../../lib'

interface Props {
    parentRouteId?: string
    detailRouteId?: string
}

export const ChallengeDetailContainer: FC<Props> = (props: Props) => {
    const parentRouteId = props.parentRouteId
        ?? activeReviewAssignmentsRouteId
    const detailRouteId = props.detailRouteId
        ?? challengeDetailRouteId
    const childRoutes = useChildRoutes(parentRouteId, detailRouteId)

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
function useChildRoutes(
    parentRouteId: string,
    detailRouteId: string,
): Array<JSX.Element> | undefined {
    const { getRouteElement }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(
        () => reviewRoutes[0].children
            ?.find(r => r.id === parentRouteId)
            ?.children?.find(r => r.id === detailRouteId)
            ?.children?.map(getRouteElement),
        [
            detailRouteId,
            getRouteElement,
            parentRouteId,
        ],
    )
    return childRoutes
}

export default ChallengeDetailContainer
