import { FC, PropsWithChildren } from 'react'

import { ContentLayout } from '~/libs/ui'

import { NavTabs } from '../NavTabs'

import styles from './Layout.module.scss'

export const NullLayout: FC<PropsWithChildren> = props => (
    <>{props.children}</>
)

export const Layout: FC<PropsWithChildren> = props => (
    <ContentLayout
        innerClass={styles.contantentLayoutInner}
        outerClass={styles.contentLayoutOuter}
    >
        <div className={styles.layout}>
            <NavTabs />

            <div className={styles.main}>
                {props.children}
            </div>
        </div>
    </ContentLayout>
)

export default Layout
