import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { ToolTitle } from '../../config'
import {
    routeContext,
    RouteContextData,
} from '../../lib'

export const toolTitle: string = ToolTitle.earn

const EarnApp: FC<{}> = () => {

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

export default EarnApp
