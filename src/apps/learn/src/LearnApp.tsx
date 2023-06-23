import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { toolTitle } from './learn.routes'
import { LearnSwr } from './lib'

const LearnApp: FC<{}> = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    return (
        <LearnSwr>
            <Outlet />
            <Routes>
                {getChildRoutes(toolTitle)}
            </Routes>
        </LearnSwr>
    )
}

export default LearnApp
