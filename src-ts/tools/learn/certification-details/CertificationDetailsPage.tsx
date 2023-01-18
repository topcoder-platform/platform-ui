import { FC, ReactNode, useContext } from 'react'
import { Params, useParams } from 'react-router-dom'

import { PageSubheaderPortalId } from '../../../config'
import { useLearnBreadcrumb, WaveHero } from '../learn-lib'
import {
    Breadcrumb,
    BreadcrumbItemModel,
    Button,
    ContentLayout,
    LoadingSpinner,
    Portal,
    profileContext,
    ProfileContextData,
    textFormatGetSafeString,
} from '../../../lib'

import { Accordion } from './accordion'
import { FAQs } from './data/faqs.data'
import { HeroTitle } from './hero-title'
import { CertificationDetailsSidebar } from './certification-details-sidebar'
import { PerksSection } from './perks-section'
import { perks } from './data/perks.data'
import styles from './CertificationDetailsPage.module.scss'

const CertificationDetailsPage: FC<{}> = () => {
    const routeParams: Params<string> = useParams()
    const { certification }: Params<string> = routeParams
    const { initialized: profileReady }: ProfileContextData = useContext(profileContext)

    const ready: boolean = profileReady

    const breadcrumb: Array<BreadcrumbItemModel> = useLearnBreadcrumb([
        {

            name: textFormatGetSafeString(certification),
            url: '',
        },
    ])

    function renderWhatWillILearnSection(): ReactNode {
        return (
            <div className={styles['text-section']}>
                <h2>What I Will Learn?</h2>
                <ul className='body-main'>
                    <li>
                        Fundamental skills required to begin a career in web development
                    </li>
                    <li>
                        Introduction to React and other front end libraries - a
                        jumping off point to build awesome websites
                    </li>
                    <li>
                        Introduction to Java Script - one of the languages every web
                        developer should know for web development and building basic
                        algorithms and data structures
                    </li>
                    <li>
                        Introduction to backend development with Node and APIs
                    </li>
                </ul>
            </div>
        )
    }

    function renderRequirementsSection(): ReactNode {
        return (
            <div className={styles['text-section']}>
                <h2>Requirements</h2>
                <p className='body-main'>
                    No prior knowledge in software development is required
                </p>
            </div>
        )
    }

    function renderFaqSection(): ReactNode {
        return (
            <div className={styles['text-section']}>
                <h2>Frequently Asked Questions</h2>
                <Accordion items={FAQs} />
            </div>
        )
    }

    return (
        <ContentLayout contentClass={styles.contentWrap} outerClass={styles.outerContentWrap}>
            {!ready && (
                <div className={styles.wrap}>
                    <LoadingSpinner />
                </div>
            )}
            <Breadcrumb items={breadcrumb} />

            <Portal portalId={PageSubheaderPortalId}>
                <div className={styles['hero-wrap']}>
                    <WaveHero
                        title={(
                            <HeroTitle
                                certTitle='Web Development Fundamentals'
                                providers={['fcc', 'topcoder']}
                            />
                        )}
                        theme='grey'
                        text={`
                            Introducing our Web Development fundamentals certification!
                            Start your certification journey with Topcoder.
                        `}
                    >
                        <Button
                            buttonStyle='primary'
                            size='md'
                            label='Enroll Now'
                        />
                    </WaveHero>
                    <CertificationDetailsSidebar />
                </div>
            </Portal>

            <PerksSection items={perks} />
            {renderWhatWillILearnSection()}
            {renderRequirementsSection()}
            {renderFaqSection()}
        </ContentLayout>
    )
}

export default CertificationDetailsPage
