/**
 * Page Wrapper.
 */
import { FC, PropsWithChildren, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { PageHeader } from '~/apps/admin/src/lib'
import { PageTitle } from '~/libs/ui'

import { BreadCrumbData } from '../../models'
import { BreadCrumb } from '../BreadCrumb'
import { IconArrowLeft, IconExternalLink } from '../../assets/icons'

import styles from './PageWrapper.module.scss'

interface Props {
    className?: string
    pageTitle: string
    backUrl?: string
    backAction?: () => void
    titleUrl?: string | 'emptyLink'
    rightHeader?: ReactNode,
    breadCrumb: BreadCrumbData[]
}

export const PageWrapper: FC<PropsWithChildren<Props>> = props => (
    <div className={classNames(styles.container, props.className)}>
        {props.breadCrumb.length > 0 && (
            <BreadCrumb list={props.breadCrumb} />
        )}
        <PageTitle>{props.pageTitle}</PageTitle>
        <div className={styles.blockHeader}>
            <div className={styles.blockHeaderRight}>
                {props.backUrl && (
                    <Link to={props.backUrl}>
                        <IconArrowLeft />
                    </Link>
                )}
                {props.backAction && (
                    <button type='button' onClick={props.backAction}>
                        <IconArrowLeft />
                    </button>
                )}
                <div className={styles.blockHeaderTitle}>
                    <PageHeader>
                        <h3 className={styles.textTitle}>
                            {props.pageTitle}
                        </h3>
                    </PageHeader>
                    {props.titleUrl && props.titleUrl !== 'emptyLink' && (
                        <a
                            className={styles.blockExternalLink}
                            href={props.titleUrl}
                            target='_blank'
                            rel='noreferrer'
                        >
                            <IconExternalLink />
                        </a>
                    )}
                    {props.titleUrl && props.titleUrl === 'emptyLink' && (
                        <button type='button' className={styles.blockExternalLink}>
                            <IconExternalLink />
                        </button>
                    )}
                </div>
            </div>

            {props.rightHeader}
        </div>

        {props.children}
    </div>
)

export default PageWrapper
