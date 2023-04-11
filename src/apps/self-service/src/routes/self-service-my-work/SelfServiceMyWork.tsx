import { FC, useContext } from 'react'
import { Provider } from 'react-redux'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'
import '~/libs/ui/lib/styles/index.scss'

import store from '../../store'
import { WorkProvider } from '../../lib'
import { workDashboardRouteId } from '../../self-service.routes'

const SelfServiceMyWork: FC<{}> = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    return (
        <Provider store={store}>
            <WorkProvider>
                <Outlet />
                <Routes>
                    {getChildRoutes(workDashboardRouteId)}
                </Routes>
            </WorkProvider>
        </Provider>
    )
}

export default SelfServiceMyWork
