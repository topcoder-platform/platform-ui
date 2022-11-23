import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import {
    ContentLayout,
    routeContext,
    RouteContextData,
} from '../../../../lib'
import { intakeFormsRouteId } from '../../Work'

const IntakeForms: FC<{}> = () => {

    const { getChildRoutes }: RouteContextData = useContext(routeContext)

    return (
        <ContentLayout>
            <Outlet />
            <Routes>
                {getChildRoutes(intakeFormsRouteId)}
            </Routes>
        </ContentLayout>
    )
}

export default IntakeForms
