import { FC, useContext } from 'react'
import { Provider } from 'react-redux'
import { Outlet, Routes } from 'react-router-dom'

import { ContentLayout, LoadingSpinner } from '~/libs/ui'
import { routerContext, RouterContextData } from '~/libs/core'

import { WorkProvider } from '../../lib'
import { intakeFormsRouteId } from '../../self-service.routes'
import store from '../../store'
import { useLoadUnfinishedWork } from './use-load-unfinished-work'

const SelfServiceIntake: FC<{}> = () => {
    const { isLoading } = useLoadUnfinishedWork();

    return (
        <LoadingSpinner hide={!isLoading} />
    )
}

const SelfServiceIntakeWrapper: FC<{}> = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    return (
        <ContentLayout>
            <Provider store={store}>
                <WorkProvider>
                    <SelfServiceIntake />
                    <Outlet />
                    <Routes>
                        {getChildRoutes(intakeFormsRouteId)}
                    </Routes>
                </WorkProvider>
            </Provider>
        </ContentLayout>
    )
}

export default SelfServiceIntakeWrapper
