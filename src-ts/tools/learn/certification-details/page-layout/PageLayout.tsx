import { FC, ReactNode } from 'react'

import { PageSubheaderPortalId } from '../../../../config'
import {
    Breadcrumb,
    BreadcrumbItemModel,
    ContentLayout,
    LoadingSpinner,
    Portal,
    textFormatGetSafeString,
} from '../../../../lib'
import {
    TCACertification,
    useLearnBreadcrumb,
    WaveHero,
} from '../../learn-lib'
import { getTCACertificationPath } from '../../learn.routes'
import { HeroTitle } from '../hero-title'

import styles from './PageLayout.module.scss'

interface PageLayoutProps {
    certification?: TCACertification
    extraBreadCrumbs?: Array<BreadcrumbItemModel>
    mainContent: ReactNode
    heroCTA?: ReactNode
    sidebarContents: ReactNode
}

const PageLayout: FC<PageLayoutProps> = (props: PageLayoutProps) => {

    const breadcrumb: Array<BreadcrumbItemModel> = useLearnBreadcrumb([
        {

            name: textFormatGetSafeString(props.certification?.title),
            url: getTCACertificationPath(props.certification?.dashedName ?? ''),
        },
        ...(props.extraBreadCrumbs ?? []),
    ])

    function renderContents(): ReactNode {
        if (!props.certification) {
            return <></>
        }

        return (
            <>
                <Breadcrumb items={breadcrumb} />

                <Portal portalId={PageSubheaderPortalId}>
                    <div className={styles['hero-wrap']}>
                        <WaveHero
                            title={(
                                <HeroTitle certification={props.certification} certTitle={props.certification.title} />
                            )}
                            theme='grey'
                            text={props.certification.introText}
                        >
                            {props.heroCTA}
                        </WaveHero>
                        {props.sidebarContents}
                    </div>
                </Portal>

                {props.mainContent}
            </>
        )
    }

    return (
        <ContentLayout
            contentClass={styles.contentWrap}
            outerClass={styles.outerContentWrap}
            innerClass={styles.innerContentWrap}
        >
            {props.mainContent ? renderContents() : (
                <div className={styles.wrap}>
                    <LoadingSpinner />
                </div>
            )}
        </ContentLayout>
    )
}

export default PageLayout