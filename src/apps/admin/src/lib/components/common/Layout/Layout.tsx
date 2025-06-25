import { FC, PropsWithChildren, useContext } from 'react'
import cn from 'classnames'

import { ContentLayout } from '~/libs/ui'
import { routerContext, RouterContextData } from '~/libs/core'
import { platformRouteId } from '~/apps/admin/src/config/routes.config'
import { platformSkillRouteId } from '~/apps/admin/src/platform-management/routes.config'
import { AppSubdomain, EnvironmentConfig } from '~/config'

import { SystemAdminTabs } from '../Tab'

import styles from './Layout.module.scss'

export const NullLayout: FC<PropsWithChildren> = props => (
    <>{props.children}</>
)

export type LayoutProps = PropsWithChildren<{
    classes?: { // eslint-disable-line react/no-unused-prop-types -- it's actually used
        contentClass?: string
        innerClass?: string
        outerClass?: string
        layoutClass?: string
        mainClass?: string
    }
}>

export const Layout: FC<LayoutProps> = props => (
    <ContentLayout
        contentClass={cn(styles.contentLayout, props.classes?.contentClass)}
        innerClass={cn(styles.contentLayoutInner, props.classes?.innerClass)}
        outerClass={cn(styles.contentLayoutOuter, props.classes?.outerClass)}
    >
        <div className={cn(styles.layout, props.classes?.layoutClass)}>
            <SystemAdminTabs />

            <div className={cn(styles.main, props.classes?.mainClass)}>
                {props.children}
            </div>
        </div>
    </ContentLayout>
)

export const PlatformManagementSkillsLayout: FC<LayoutProps> = props => (
    <Layout classes={{ contentClass: styles.platformSkillsContentLayout }}>
        {props.children}
    </Layout>
)

export function useLayout(): { Layout: FC<LayoutProps> } {
    const routerContextData: RouterContextData = useContext(routerContext)

    if (!routerContextData.initialized) return { Layout }

    const skillManagementRouteId = EnvironmentConfig.SUBDOMAIN === AppSubdomain.admin
        ? `/${platformRouteId}/${platformSkillRouteId}`
        : `/${AppSubdomain.admin}/${platformRouteId}/${platformSkillRouteId}`

    if (window.location.pathname.toLowerCase()
        .startsWith(skillManagementRouteId.toLowerCase())) {
        return { Layout: PlatformManagementSkillsLayout }
    }

    return { Layout }
}

export default Layout
