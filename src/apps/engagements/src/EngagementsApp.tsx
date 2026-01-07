import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'
import { routerContext, RouterContextData } from '~/libs/core'
import { toolTitle } from './engagements.routes'
import { EngagementsSwr } from './lib'

const EngagementsApp: FC<{}> = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    return (
        <EngagementsSwr>
            <Outlet />
            <Routes>
                {getChildRoutes(toolTitle)}
            </Routes>
        </EngagementsSwr>
    )
}

export default EngagementsApp
