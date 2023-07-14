import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { toolTitle } from './talent-search.routes'

const TalentSearchApp: FC<{}> = () => {

    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    return (
        <>
            <Outlet />
            <Routes>
                {getChildRoutes(toolTitle)}
            </Routes>
        </>
    )
}

export default TalentSearchApp
