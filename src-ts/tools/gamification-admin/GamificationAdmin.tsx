import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'
import { SWRConfig } from 'swr'

import {
    routeContext,
    RouteContextData,
    xhrGetAsync,
} from '../../lib'

export const toolTitle: string = 'Gamification Admin'

const GamificationAdmin: FC<{}> = () => {

    const { getChildRoutes }: RouteContextData = useContext(routeContext)

    return (
        <SWRConfig
            value={{
                fetcher: (resource) => xhrGetAsync(resource),
                refreshInterval: 60000, // 1 min
            }}
        >
            <Outlet />
            <Routes>
                {getChildRoutes(toolTitle)}
            </Routes>
        </SWRConfig>
    )
}

export default GamificationAdmin
