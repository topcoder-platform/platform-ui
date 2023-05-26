import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { toolTitle } from './accounts.routes'
import { AccountsSwr } from './lib'

const AccountsApp: FC<{}> = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    return (
        <AccountsSwr>
            <Outlet />
            <Routes>
                {getChildRoutes(toolTitle)}
            </Routes>
        </AccountsSwr>
    )
}

export default AccountsApp
