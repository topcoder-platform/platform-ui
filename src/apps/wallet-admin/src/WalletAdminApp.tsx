import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { toolTitle } from './wallet-admin.routes'
import { WalletSwr } from './lib'

const AccountsApp: FC<{}> = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    return (
        <WalletSwr>
            <Outlet />
            <Routes>{getChildRoutes(toolTitle)}</Routes>
        </WalletSwr>
    )
}

export default AccountsApp
