import { FC, PropsWithChildren, useContext, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { Layout } from '../lib/components'
import { ChallengeManagementContextProvider } from '../lib/contexts'
import { adminRoutes } from '../admin-app.routes'
import { manageChallengeRouteId } from '../config/routes.config'

/**
 * The router outlet with layout.
 */
export const ChallengeManagement: FC & {
    Layout: FC<PropsWithChildren>
} = () => {
    const childRoutes = useChildRoutes()

    return (
        <ChallengeManagementContextProvider>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </ChallengeManagementContextProvider>
    )
}

function useChildRoutes(): Array<JSX.Element> | undefined {
    const { getRouteElement }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(
        () => adminRoutes[0].children
            ?.find(r => r.id === manageChallengeRouteId)
            ?.children?.map(getRouteElement),
        [], // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: getRouteElement
    )
    return childRoutes
}

/**
 * The outlet layout.
 */
ChallengeManagement.Layout = function ChallengeManagementLayout(
    props: PropsWithChildren,
) {
    return <Layout>{props.children}</Layout>
}

export default ChallengeManagement
