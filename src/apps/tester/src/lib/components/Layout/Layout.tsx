import { FC, PropsWithChildren } from 'react'

import { ContentLayout } from '~/libs/ui'

import { NavTabs } from '../NavTabs'

import styles from './Layout.module.scss'

export const Layout: FC<PropsWithChildren> = props => (
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

export default Layout
