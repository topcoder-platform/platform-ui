import { FC, PropsWithChildren, ReactNode } from 'react'
import classNames from 'classnames'

import { PageWrapper as ReviewPageWrapper } from '~/apps/review/src/lib/components/PageWrapper'
import type { BreadCrumbData } from '~/apps/review/src/lib/models'

import styles from './PageWrapper.module.scss'

const DEFAULT_BREADCRUMB: BreadCrumbData[] = [
    { index: 1, label: 'Tester' },
]

interface Props {
    className?: string
    pageTitle?: string
    backUrl?: string
    backAction?: () => void
    titleUrl?: string | 'emptyLink'
    rightHeader?: ReactNode
    breadCrumb?: BreadCrumbData[]
}

export const PageWrapper: FC<PropsWithChildren<Props>> = (props: PropsWithChildren<Props>) => {
    const pageTitle = props.pageTitle ?? 'Tester'
    const breadCrumb = props.breadCrumb ?? DEFAULT_BREADCRUMB

    return (
        <ReviewPageWrapper
            backAction={props.backAction}
            backUrl={props.backUrl}
            breadCrumb={breadCrumb}
            className={classNames(styles.pageWrapper, props.className)}
            pageTitle={pageTitle}
            rightHeader={props.rightHeader}
            titleUrl={props.titleUrl}
        >
            {props.children}
        </ReviewPageWrapper>
    )
}

export default PageWrapper
