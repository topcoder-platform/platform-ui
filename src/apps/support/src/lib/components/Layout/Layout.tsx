/** Responsive content shell shared by all Support pages. */
import { FC, PropsWithChildren } from 'react'

import { ContentLayout } from '~/libs/ui'

import styles from './Layout.module.scss'

/**
 * Places Support content in the standard Platform UI content width.
 *
 * @param props children rendered in the main content region.
 * @returns the Support page layout.
 * @throws Does not throw.
 */
export const Layout: FC<PropsWithChildren> = props => (
    <ContentLayout
        innerClass={styles.inner}
        outerClass={styles.outer}
    >
        <main className={styles.main}>{props.children}</main>
    </ContentLayout>
)

export default Layout
