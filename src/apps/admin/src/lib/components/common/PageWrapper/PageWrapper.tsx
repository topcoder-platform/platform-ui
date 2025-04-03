/**
 * Page Wrapper.
 */
import { FC, PropsWithChildren, ReactNode } from 'react'
import classNames from 'classnames'

import { PageContent, PageHeader } from '~/apps/admin/src/lib'
import { PageTitle } from '~/libs/ui'

import styles from './PageWrapper.module.scss'

interface Props {
    className?: string
    pageTitle: string
    headerActions?: ReactNode
}

export const PageWrapper: FC<PropsWithChildren<Props>> = props => (
    <div className={classNames(styles.container, props.className)}>
        <PageTitle>{props.pageTitle}</PageTitle>
        <PageHeader>
            <h3 className={styles.textTitle}>{props.pageTitle}</h3>

            {props.headerActions ? (
                <div className={styles.headerActions}>
                    {props.headerActions}
                </div>
            ) : undefined}
        </PageHeader>
        <PageContent>{props.children}</PageContent>
    </div>
)

export default PageWrapper
