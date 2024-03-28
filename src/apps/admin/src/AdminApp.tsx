import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'
import { SharedSwrConfig } from '~/libs/shared'

import { toolTitle } from './admin.routes'

const AdminApp: FC<{}> = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    return (
        <SharedSwrConfig>
            <Outlet />
            <Routes>
                {getChildRoutes(toolTitle)}
            </Routes>
        </SharedSwrConfig>
    )
}

export default AdminApp