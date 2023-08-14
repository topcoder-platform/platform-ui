import { FC, useContext, useEffect } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { authUrlLogin, authUrlLogoutFn, routerContext, RouterContextData } from '~/libs/core'
import { ConfigContextValue, SharedSwrConfig, useConfigContext } from '~/libs/shared'

import { absoluteRootRoute, toolTitle } from './profiles.routes'

const ProfilesApp: FC<{}> = () => {
    const { setLogoutUrl }: ConfigContextValue = useConfigContext()
    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    useEffect(() => {
        setLogoutUrl(authUrlLogoutFn(authUrlLogin(absoluteRootRoute)))
    }, [setLogoutUrl])

    return (
        <SharedSwrConfig>
            <Outlet />
            <Routes>
                {getChildRoutes(toolTitle)}
            </Routes>
        </SharedSwrConfig>
    )
}

export default ProfilesApp
