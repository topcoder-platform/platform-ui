import { FC, useContext, useEffect } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'
import { SharedSwrConfig } from '~/libs/shared'

import { toolTitle } from './copilots.routes'
import './styles/index.scss'

const CopilotsApp: FC<{}> = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    useEffect(() => {
        document.body.classList.add('copilots-app')
        return () => document.body.classList.remove('copilots-app')
    }, [])

    return (
        <SharedSwrConfig>
            <Outlet />
            <Routes>
                {getChildRoutes(toolTitle)}
            </Routes>
        </SharedSwrConfig>
    )
}

export default CopilotsApp
