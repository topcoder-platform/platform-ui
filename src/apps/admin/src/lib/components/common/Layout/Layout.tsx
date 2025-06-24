import { FC, PropsWithChildren, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import classNames from 'classnames'

import { platformRouteId } from '~/apps/admin/src/config/routes.config'
import { ContentLayout } from '~/libs/ui'

import { SystemAdminTabs } from '../Tab'

import styles from './Layout.module.scss'

export const NullLayout: FC<PropsWithChildren> = props => <>{props.children}</>

export const Layout: FC<PropsWithChildren> = props => {
    const { pathname }: { pathname: string } = useLocation()
    const isPlatformPage = useMemo(
        () => pathname.indexOf(platformRouteId) >= 0,
        [pathname],
    )

    return (
        <ContentLayout
            innerClass={styles.contantentLayoutInner}
            outerClass={styles.contentLayoutOuter}
        >
            <div className={styles.layout}>
                <SystemAdminTabs />

                <div
                    className={classNames(styles.main, {
                        [styles.isPlatformPage]: isPlatformPage,
                    })}
                >
                    {props.children}
                </div>
            </div>
        </ContentLayout>
    )
}

export default Layout
