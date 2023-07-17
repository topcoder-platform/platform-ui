import { FC, useContext, useEffect } from 'react'
import { Outlet, Routes } from 'react-router-dom'
import { connect, Provider } from 'react-redux'
import classNames from 'classnames'

import { routerContext, RouterContextData } from '~/libs/core'
import { Member } from '~/apps/talent-search/src/lib/models'
import { EnvironmentConfig } from '~/config'

import { onboardRouteId } from '../../onboarding.routes'
import { fetchMemberInfo, fetchMemberTraits } from '../../redux/actions/member'
import store from '../../redux/store'
import '../../styles/global/_index.scss'

import styles from './styles.module.scss'

const OnboardingFooterContent: FC<{
    fetchMemberInfo: () => void
    fetchMemberTraits: () => void
    reduxMemberInfo: Member | undefined
}> = props => {
    useEffect(() => {
        props.fetchMemberInfo()
        props.fetchMemberTraits()
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [])

    return (
        <span className={styles.textFooter}>
            I will complete this onboarding later,
            <a href={`${EnvironmentConfig.USER_PROFILE_URL}/${props.reduxMemberInfo?.handle}`}> skip for now</a>
            .
        </span>
    )
}

const mapStateToProps: any = (state: any) => {
    const {
        memberInfo,
    }: any = state.member

    return {
        reduxMemberInfo: memberInfo,
    }
}

const mapDispatchToProps: any = {
    fetchMemberInfo,
    fetchMemberTraits,
}
const OnboardingFooter: any = connect(mapStateToProps, mapDispatchToProps)(OnboardingFooterContent)

const OnboardingContent: FC<{
}> = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)

    return (
        <>
            <div className={classNames('d-flex flex-column', styles.container)}>
                <Outlet />
                <Routes>
                    {getChildRoutes(onboardRouteId)}
                </Routes>
                <div id='calendar-portal' />
            </div>
            <OnboardingFooter />
        </>
    )
}

export const OnboardingWrapper: FC<{}> = () => (
    <div className={classNames(styles.blockWrapper, 'd-flex flex-column align-items-center')}>
        <Provider store={store}>
            <OnboardingContent />
        </Provider>
    </div>
)

export default OnboardingWrapper
