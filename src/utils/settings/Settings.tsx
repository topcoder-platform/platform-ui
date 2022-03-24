import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import {
    authUrlLogin,
    ContentLayout,
    profileContext,
    ProfileContextData,
    RouteContext,
    RouteContextData,
    routeRoot,
} from '../../lib'
import '../../lib/styles/index.scss'

export const utilTitle: string = 'Settings'

const Settings: FC<{}> = () => {

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile, initialized }: ProfileContextData = profileContextData

    const { getChildRoutes }: RouteContextData = useContext(RouteContext)

    // TODO: create an auth provider
    // if we don't have a profile, don't show the page until it's initialized
    if (!profile) {
        // if we're already initialized, navigate to the login page
        if (initialized) {
            window.location.href = authUrlLogin(routeRoot)
        }
        return <></>
    }

    return (
        <ContentLayout title={utilTitle}>
            <>
                <Outlet />
                <Routes>
                    {getChildRoutes(utilTitle)}
                </Routes>
            </>
        </ContentLayout>
    )
}

export default Settings
