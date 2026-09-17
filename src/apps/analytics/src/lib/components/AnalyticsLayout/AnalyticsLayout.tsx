/** Responsive page layout shared by both Analytics tabs. */
import { FC, PropsWithChildren } from 'react'

import { ContentLayout } from '~/libs/ui'

import { AnalyticsNav } from '../AnalyticsNav'

import styles from './AnalyticsLayout.module.scss'

/**
 * Places analytics content below its dedicated tab navigation.
 *
 * @param props React children rendered in the constrained content region.
 * @returns Analytics page layout.
 * @throws Does not throw.
 */
export const AnalyticsLayout: FC<PropsWithChildren> = props => (
    <>
        <AnalyticsNav />
        <ContentLayout
            innerClass={styles.contentLayoutInner}
            outerClass={styles.contentLayoutOuter}
        >
            <main className={styles.main}>{props.children}</main>
        </ContentLayout>
    </>
)

export default AnalyticsLayout
