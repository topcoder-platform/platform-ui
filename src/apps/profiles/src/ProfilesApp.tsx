import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { routerContext, RouterContextData } from '~/libs/core'

import { toolTitle } from './profiles.routes'
import { ProfileSwr } from './lib'

const ProfilesApp: FC<{}> = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    return (
        <ProfileSwr>
            <Outlet />
            <Routes>
                {getChildRoutes(toolTitle)}
            </Routes>
        </ProfileSwr>
    )
}

export default ProfilesApp
