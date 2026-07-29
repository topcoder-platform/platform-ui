/**
 * Responsive page layout shared by all Status routes.
 */
import { FC, PropsWithChildren } from 'react'

import { ContentLayout } from '~/libs/ui'

import { NavTabs } from '../NavTabs'

import styles from './Layout.module.scss'

/**
 * Places Status content below its Review-style navigation bar.
 *
 * @param props React children rendered in the constrained content region.
 * @returns the Status page layout.
 * @throws Does not throw.
 */
export const Layout: FC<PropsWithChildren> = props => (
    <>
        <NavTabs />
        <ContentLayout
            innerClass={styles.contentLayoutInner}
            outerClass={styles.contentLayoutOuter}
        >
            <main className={styles.main}>{props.children}</main>
        </ContentLayout>
    </>
)

export default Layout
