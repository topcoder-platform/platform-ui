/* eslint-disable react/no-array-index-key */
/**
 * Page Wrapper.
 */
import { FC, PropsWithChildren, ReactNode, useMemo } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { PageHeader } from '~/apps/admin/src/lib'
import { PageTitle } from '~/libs/ui'

import { BreadCrumbData } from '../../models'
import { BreadCrumb } from '../BreadCrumb'
import { IconArrowLeft, IconExternalLink } from '../../assets'

import styles from './PageWrapper.module.scss'

interface Props {
    className?: string
    pageTitle: string
    backUrl?: string
    backAction?: () => void
    titleUrl?: string | 'emptyLink'
    rightHeader?: ReactNode
    breadCrumb: BreadCrumbData[]
    introText: string
    shouldShowIntroState?: boolean
    sidebar: ReactNode | ReactNode[]
}

export const PageWrapper: FC<PropsWithChildren<Props>> = props => {
    const sidebarPanels: ReactNode[] = useMemo(() => (
        props.sidebar && !Array.isArray(props.sidebar) ? [props.sidebar] : props.sidebar as ReactNode[]
    ), [props.sidebar])

    return (
        <div className={classNames(styles.container, props.className)}>
            <BreadCrumb list={props.breadCrumb} />
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

            <div className={styles.pageArea}>
                <div className={styles.pageHero} />
                <div className={styles.pageBody}>
                    <aside className={styles.sidebar}>
                        {sidebarPanels?.map((panel, i) => (
                            <section className={styles.panel} key={i}>{panel}</section>
                        ))}
                    </aside>
                    <section
                        className={classNames(
                            styles.resultsPanel,
                            props.shouldShowIntroState && styles.resultsPanelEmpty,
                        )}
                    >
                        {props.shouldShowIntroState && (
                            <div className={styles.emptyState}>
                                <p className={styles.emptyStateDescription}>
                                    {props.introText}
                                </p>
                            </div>
                        )}

                        {!props.shouldShowIntroState && (
                            <div className={styles.resultsContent}>{props.children}</div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}

export default PageWrapper
