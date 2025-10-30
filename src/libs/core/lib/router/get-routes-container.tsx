/**
 * The router outlet.
 */

import { FC, Fragment, PropsWithChildren, useContext, useEffect, useMemo } from 'react'
import { Outlet, Routes, useLocation } from 'react-router-dom'

import { PlatformRoute } from './platform-route.model'
import { routerContext, RouterContextData } from './router-context'

export function getRoutesContainer(childRoutes: ReadonlyArray<PlatformRoute>, contextContainer?: FC): JSX.Element {
    const ContextContainer = contextContainer ?? Fragment
    const Container = () => {
        const location = useLocation()
        const { getRouteElement }: RouterContextData = useContext(routerContext)
        const childRoutesWithContext = useMemo(
            () => childRoutes.map(getRouteElement),
            [getRouteElement],
        )

        useEffect(() => {
            window.scrollTo(0, 0)
        }, [location.pathname])

        return (
            <ContextContainer>
                <Outlet />
                <Routes>{childRoutesWithContext}</Routes>
            </ContextContainer>
        )
    }

    return <Container />
}
