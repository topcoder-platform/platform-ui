import { FC, useContext } from 'react'
import { Outlet, Routes } from 'react-router-dom'

import {
    ContentLayout,
    routeContext,
    RouteContextData,
} from '../../../../lib'

export const intakeFormsTitle: string = 'Work Intake Forms'

const IntakeForms: FC<{}> = () => {

    const { getChildRoutes }: RouteContextData = useContext(routeContext)

    return (
        <ContentLayout>
            <Outlet />
            <Routes>
                {getChildRoutes(intakeFormsTitle)}
            </Routes>
        </ContentLayout>
    )
}

export default IntakeForms
