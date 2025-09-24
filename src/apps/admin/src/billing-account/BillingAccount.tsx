import { FC, PropsWithChildren, useContext, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { Layout } from '../lib/components'
import { adminRoutes } from '../admin-app.routes'
import { billingAccountRouteId } from '../config/routes.config'

/**
 * The router outlet with layout.
 */
export const BillingAccount: FC & {
    Layout: FC<PropsWithChildren>
} = () => {
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
            ?.find(r => r.id === billingAccountRouteId)
            ?.children?.map(getRouteElement),
        [], // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: getRouteElement
    )
    return childRoutes
}

/**
 * The outlet layout.
 */
BillingAccount.Layout = function BillingAccountLayout(
    props: PropsWithChildren,
) {
    return <Layout>{props.children}</Layout>
}

export default BillingAccount
