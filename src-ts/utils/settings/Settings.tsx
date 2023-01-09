import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { ContentLayout, routeContext, RouteContextData } from '../../lib'

export const toolTitle: string = 'Account Settings'

/**
 * DEPRECATED
 * TODO: Remove after some time, when clear no one links to here...
 */
const Settings: FC<{}> = () => {

    const { getChildRoutes }: RouteContextData = useContext(routeContext)

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
