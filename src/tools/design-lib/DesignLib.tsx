import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import { ToolTitle } from '../../config'
import { ContentLayout, routeContext, RouteContextData } from '../../lib'

export const toolTitle: string = ToolTitle.designLib

const DesignLib: FC<{}> = () => {

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

export default DesignLib
