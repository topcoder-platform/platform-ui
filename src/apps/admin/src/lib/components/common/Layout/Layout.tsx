import { FC, PropsWithChildren } from 'react'

import { ContentLayout } from '~/libs/ui'

import { SystemAdminTabs } from '../Tab'

import styles from './Layout.module.scss'

export const NullLayout: FC<PropsWithChildren> = props => (
    <>{props.children}</>
)

export const Layout: FC<PropsWithChildren> = props => (
    <ContentLayout outerClass={styles.contentLayoutOuter}>
        <div className={styles.layout}>
            <SystemAdminTabs />

            <div className={styles.main}>
                {props.children}
            </div>
        </div>
    </ContentLayout>
)

export default Layout
