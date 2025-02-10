import { FC, PropsWithChildren, useContext, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'
import { routerContext, RouterContextData } from '~/libs/core'
import { Layout } from '../lib/components'
import { ChallengeManagementContextProvider } from '../lib/contexts'
import { adminRoutes } from '../admin-app.routes'

/**
 * The router outlet with layout.
 */
export const ChallengeManagement: FC & { Layout: FC<PropsWithChildren> } = () => {
    const childRoutes = getChildRoutes()

    return (
        <ChallengeManagementContextProvider>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </ChallengeManagementContextProvider>
    )
}

function getChildRoutes() {
    const { getRouteElement }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(
        () => adminRoutes[0].children!.find(r => r.id === 'challenge-management')?.children!.map(getRouteElement),
        [],
    )
    return childRoutes
}

/**
 * The outlet layout.
 */
ChallengeManagement.Layout = function ({ children }) {
    return <Layout>{children}</Layout>
}

export default ChallengeManagement
