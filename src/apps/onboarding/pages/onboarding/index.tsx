import { FC, useContext, useEffect } from 'react'
import { Outlet, Routes } from 'react-router-dom'
import { connect, Provider } from 'react-redux'
import classNames from 'classnames'

import { ContentLayout } from '~/libs/ui'
import { routerContext, RouterContextData } from '~/libs/core'

import { onboardRouteId } from '../../onboarding.routes'
import { fetchMemberInfo } from '../../redux/actions/member'
import store from '../../redux/store'
import '../../styles/global/_index.scss'

import styles from './styles.module.scss'

const OnboardingContent: FC<{ fetchMemberInfo: () => void }> = props => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    useEffect(() => {
        props.fetchMemberInfo()
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [])

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <Outlet />
            <Routes>
                {getChildRoutes(onboardRouteId)}
            </Routes>
        </div>
    )
}

const mapDispatchToProps: any = {
    fetchMemberInfo,
}
const Onboarding: any = connect(undefined, mapDispatchToProps)(OnboardingContent)

export const OnboardingWrapper: FC<{}> = () => (
    <ContentLayout>
        <Provider store={store}>
            <Onboarding />
        </Provider>
    </ContentLayout>
)

export default OnboardingWrapper
