import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'
import { SWRConfig } from 'swr'

import { ToolTitle } from '~/config'
import { routerContext, RouterContextData, xhrGetAsync } from '~/libs/core'

export const toolTitle: string = ToolTitle.gamificationAdmin

const GamificationAdmin: FC<{}> = () => {

    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    return (
        <SWRConfig
            value={{
                fetcher: resource => xhrGetAsync(resource),
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
