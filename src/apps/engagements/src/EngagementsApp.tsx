import type { FC } from 'react'
import { useContext, useEffect } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import type { RouterContextData } from '~/libs/core'
import { routerContext } from '~/libs/core'

import { toolTitle } from './engagements.routes'
import { EngagementsSwr } from './lib'
import './styles/index.scss'

const EngagementsApp: FC<{}> = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    useEffect(() => {
        document.body.classList.add('engagements-app')
        return () => document.body.classList.remove('engagements-app')
    }, [])

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
