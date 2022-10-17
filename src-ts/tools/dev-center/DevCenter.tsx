import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import {
    routeContext,
    RouteContextData,
} from '../../lib'

import { toolTitle } from './dev-center.routes'

const DevCenter: FC<{}> = () => {

    const { getChildRoutes }: RouteContextData = useContext(routeContext)

    return (
        <>
            <Outlet />
            <Routes>
                {getChildRoutes(toolTitle)}
            </Routes>
        </>
    )
}

export default DevCenter
