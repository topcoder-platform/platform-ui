import { FC, useContext } from 'react'
import { NavigateFunction, Outlet, Routes, useNavigate } from 'react-router-dom'

import {
    authUrlLogin,
    ContentLayout,
    ProfileContext,
    ProfileContextData,
    RouteContext,
    RouteContextData,
    routeRoot,
} from '../../lib'
import '../../lib/styles/index.scss'

export const utilTitle: string = 'Settings'

const Settings: FC<{}> = () => {

    const profileContext: ProfileContextData = useContext(ProfileContext)
    const { profile }: ProfileContextData = profileContext

    const { getChildRoutes }: RouteContextData = useContext(RouteContext)

    const navigate: NavigateFunction = useNavigate()

    // if we don't have a profile, navigate to the login page
    if (!profile) {
        navigate(authUrlLogin(routeRoot))
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
