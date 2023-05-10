import { FC, ReactElement, ReactNode } from 'react'

import {
    Breadcrumb,
    BreadcrumbItemModel,
    ContentLayout,
    LoadingSpinner,
} from '~/libs/ui'
import { textFormatGetSafeString } from '~/libs/shared'

import {
    TCACertification,
    useLearnBreadcrumb,
    WaveHero,
} from '../../lib'
import { getTCACertificationPath } from '../../learn.routes'
import { HeroTitle } from '../hero-title'

import styles from './PageLayout.module.scss'

interface PageLayoutProps {
    certification?: TCACertification
    extraBreadCrumbs?: Array<BreadcrumbItemModel>
    mainContent: ReactNode
    heroCTA?: ReactNode
    sidebarContents: ReactNode
    children?: ReactNode
    hideWaveHeroText?: boolean
}

const PageLayout: FC<PageLayoutProps> = (props: PageLayoutProps) => {

    const breadcrumb: Array<BreadcrumbItemModel> = useLearnBreadcrumb([
        {

            name: textFormatGetSafeString(props.certification?.title),
            url: getTCACertificationPath(props.certification?.dashedName ?? ''),
        },
        ...(props.extraBreadCrumbs ?? []),
    ])

    function renderContents(): ReactElement {
        if (!props.certification) {
            return <></>
        }

        return (
            <>
                <Breadcrumb items={breadcrumb} />

                <div className={styles['hero-wrap']}>
                    <WaveHero
                        title={(
                            <HeroTitle certification={props.certification} certTitle={props.certification.title} />
                        )}
                        theme='grey'
                        text={!props.hideWaveHeroText ? props.certification.introText : ''}
                    >
                        {props.heroCTA}
                    </WaveHero>
                    {props.sidebarContents}
                </div>

                <ContentLayout
                    contentClass={styles.contentWrap}
                    outerClass={styles.outerContentWrap}
                    innerClass={styles.innerContentWrap}
                >
                    {props.mainContent}
                    {props.children}
                </ContentLayout>
            </>
        )
    }

    return (
        props.mainContent ? renderContents() : (
            <div className={styles.wrap}>
                <LoadingSpinner />
            </div>
        )
    )
}

export default PageLayout
