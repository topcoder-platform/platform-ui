import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'
import { Provider } from 'react-redux'

import { routerContext, RouterContextData } from '~/libs/core'

import { toolTitle } from './earn.routes'
import store from './store'

const EarnApp: FC<{}> = () => {

    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    return (
        <Provider store={store}>
            <Outlet />
            <Routes>
                {getChildRoutes(toolTitle)}
            </Routes>
        </Provider>
    )
}

export default EarnApp
