import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { RouterContextData, routerContext } from '~/libs/core'

import { toolTitle } from './earn.routes'
import { Provider } from 'react-redux'

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
