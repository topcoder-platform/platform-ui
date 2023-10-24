import { FC, useContext, useEffect } from 'react'
import { Outlet, Routes, useLocation } from 'react-router-dom'
import { Provider, useDispatch, useSelector } from 'react-redux'
import classNames from 'classnames'

import { routerContext, RouterContextData } from '~/libs/core'
import { Member } from '~/apps/talent-search/src/lib/models'
import { EnvironmentConfig } from '~/config'

import { onboardRouteId } from '../../onboarding.routes'
import { fetchMemberInfo, fetchMemberTraits } from '../../redux/actions/member'
import store from '../../redux/store'
import '../../styles/global/_index.scss'

import styles from './styles.module.scss'

const OnboardingContent: FC<{
}> = () => {
    const { getChildRoutes }: RouterContextData = useContext(routerContext)
    const location = useLocation()
    const dispatch = useDispatch()
    const reduxMemberInfo: Member = useSelector((state: any) => state.member.memberInfo)

    useEffect(() => {
        dispatch(fetchMemberInfo())
        dispatch(fetchMemberTraits())
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [])

    useEffect(
        () => {
            window.scrollTo(0, 0)
        },
        [location.pathname],
    )

    return (
        <>
            <div className={classNames('d-flex flex-column', styles.container)}>
                <Outlet />
                <Routes>
                    {getChildRoutes(onboardRouteId)}
                </Routes>
            </div>
            <span className={styles.textFooter}>
                I will complete this onboarding later,
                <a href={`${EnvironmentConfig.USER_PROFILE_URL}/${reduxMemberInfo?.handle}`}> skip for now</a>
                .
            </span>
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
