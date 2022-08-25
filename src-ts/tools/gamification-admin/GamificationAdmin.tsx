import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import {
    routeContext,
    RouteContextData,
} from '../../lib'

export const toolTitle: string = 'Gamification Admin'
export const baseUrl: string = '/gamification-admin'

const GamificationAdmin: FC<{}> = () => {

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

export default GamificationAdmin
