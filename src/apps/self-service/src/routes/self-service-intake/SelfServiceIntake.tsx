import { FC, useContext } from 'react'
import { Provider } from 'react-redux'
import { Outlet, Routes } from 'react-router-dom'

import { ContentLayout } from '~/libs/ui'
import { routerContext, RouterContextData } from '~/libs/core'

import { WorkProvider } from '../../lib'
import { intakeFormsRouteId } from '../../self-service.routes'
import store from '../../store'

const SelfServiceIntake: FC<{}> = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    return (
        <ContentLayout>
            <Provider store={store}>
                <WorkProvider>
                    <Outlet />
                    <Routes>
                        {getChildRoutes(intakeFormsRouteId)}
                    </Routes>
                </WorkProvider>
            </Provider>
        </ContentLayout>
    )
}

export default SelfServiceIntake