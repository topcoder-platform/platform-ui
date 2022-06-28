import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import {
    ContentLayout,
    routeContext,
    RouteContextData,
} from '../../lib'

export const toolTitle: string = 'Devs'

const DevCenter: FC<{}> = () => {

    const { getChildRoutes }: RouteContextData = useContext(routeContext)

    return (
        <ContentLayout title={'Developer Center'}>
            <Outlet />
            <Routes>
                {getChildRoutes(toolTitle)}
            </Routes>
        </ContentLayout>
    )
}

export default DevCenter
