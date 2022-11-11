import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { ToolTitle } from '../../config'
import {
    routeContext,
    RouteContextData,
} from '../../lib'

import { LearnSwr } from './learn-lib'

export const toolTitle: string = ToolTitle.learn

const Learn: FC<{}> = () => {

    const { getChildRoutes }: RouteContextData = useContext(routeContext)

    return (
        <LearnSwr>
            <Outlet />
            <Routes>
                {getChildRoutes(toolTitle)}
            </Routes>
        </LearnSwr>
    )
}

export default Learn
