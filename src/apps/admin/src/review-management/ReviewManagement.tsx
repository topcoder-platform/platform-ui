import { FC, PropsWithChildren, useContext, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { Layout } from '../lib/components'
import { ReviewManagementContextProvider } from '../lib/contexts'
import { adminRoutes } from '../admin-app.routes'
import { manageReviewRouteId } from '../config/routes.config'

/**
 * The router outlet with layout.
 */
export const ReviewManagement: FC & {
    Layout: FC<PropsWithChildren>
} = () => {
    const childRoutes = useChildRoutes()

    return (
        <ReviewManagementContextProvider>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </ReviewManagementContextProvider>
    )
}

function useChildRoutes(): Array<JSX.Element> | undefined {
    const { getRouteElement }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(
        () => adminRoutes[0].children
            ?.find(r => r.id === manageReviewRouteId)
            ?.children?.map(getRouteElement),
        [], // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: getRouteElement
    )
    return childRoutes
}

/**
 * The outlet layout.
 */
ReviewManagement.Layout = function ReviewManagementLayout(
    props: PropsWithChildren,
) {
    return <Layout>{props.children}</Layout>
}

export default ReviewManagement
