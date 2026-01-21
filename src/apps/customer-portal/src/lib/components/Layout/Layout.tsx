import { FC, PropsWithChildren, useContext, useMemo } from 'react'

import { ContentLayout } from '~/libs/ui'
import { RestrictedPage } from '~/libs/shared'

import { NavTabs } from '../NavTabs'
import { CustomerPortalAppContext } from '../../contexts'
import { CustomerPortalAppContextModel } from '../../models'
import { PRIVILEGED_ROLES } from '../../../config/index.config'

import styles from './Layout.module.scss'

export const NullLayout: FC<PropsWithChildren> = props => (
    <>{props.children}</>
)

export const Layout: FC<PropsWithChildren> = props => {
    const { loginUserInfo }: CustomerPortalAppContextModel = useContext(CustomerPortalAppContext)
    const userRoles = useMemo(() => loginUserInfo?.roles || [], [loginUserInfo?.roles])
    const isUnprivilegedUser = useMemo(() => {
        if (!loginUserInfo) return true

        return !userRoles.some(role => PRIVILEGED_ROLES.includes(role))
    }, [loginUserInfo, userRoles])

    if (isUnprivilegedUser) {
        return (
            <RestrictedPage />
        )
    }

    return (
        <>
            <NavTabs />
            <ContentLayout
                innerClass={styles.contantentLayoutInner}
                outerClass={styles.contentLayoutOuter}
            >
                <div className={styles.layout}>
                    <div className={styles.main}>{props.children}</div>
                </div>
            </ContentLayout>
        </>
    )
}

export default Layout
