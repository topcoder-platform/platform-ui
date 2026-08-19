import { FC, useContext, useMemo } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { toolTitle } from './campus.routes'

const CampusApp: FC = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const childRoutes = useMemo(() => getChildRoutes(toolTitle), [getChildRoutes])

    return (
        <>
            <Outlet />
            <Routes>{childRoutes}</Routes>
        </>
    )
}

export default CampusApp
