import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { ContentLayout, profileContext, ProfileContextData, routeContext, RouteContextData } from '../../lib'

export const toolTitle: string = 'Account Settings'

const Settings: FC<{}> = () => {

    const { getChildRoutes }: RouteContextData = useContext(routeContext)

    const profileContextData: ProfileContextData = useContext(profileContext)
    const { profile }: ProfileContextData = profileContextData

    // if we don't have a profile, don't show the page
    if (!profile) {
        return <></>
    }

    return (
        <ContentLayout title={toolTitle}>
            <>
                <Outlet />
                <Routes>
                    {getChildRoutes(toolTitle)}
                </Routes>
            </>
        </ContentLayout>
    )
}

export default Settings
