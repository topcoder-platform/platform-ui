import { FC, PropsWithChildren } from 'react'
import { useLocation } from 'react-router-dom'

import { ContentLayout } from '~/libs/ui'

import { roleErrorRouteId } from '../../../config/routes.config'
import { NavTabs } from '../NavTabs'

import styles from './Layout.module.scss'

export const NullLayout: FC<PropsWithChildren> = props => (
    <>{props.children}</>
)

export const Layout: FC<PropsWithChildren> = props => {
    const { pathname }: { pathname: string } = useLocation()
    const hideNavTabs = isRoleErrorPath(pathname)

    return (
        <>
            {!hideNavTabs && <NavTabs />}
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

function isRoleErrorPath(pathname: string): boolean {
    const normalizedPath = pathname === '/'
        ? pathname
        : pathname.replace(/\/+$/, '')

    return normalizedPath === `/${roleErrorRouteId}`
        || normalizedPath.endsWith(`/${roleErrorRouteId}`)
}

export default Layout
