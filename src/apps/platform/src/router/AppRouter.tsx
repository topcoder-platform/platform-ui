import { FC, ReactElement, useContext } from 'react'
import { Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

const AppRouter: FC<{}> = () => {
    const { allRoutes, getRouteElement }: RouterContextData = useContext(routerContext)

    const routeElements: Array<ReactElement> = allRoutes
        .map(route => getRouteElement(route))

    return (
        <Routes>
            {routeElements}
        </Routes>
    )
}

export default AppRouter
