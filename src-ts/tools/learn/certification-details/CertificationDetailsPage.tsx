import { FC, ReactNode, useContext } from 'react'
import { Params, useParams } from 'react-router-dom'

import { PageSubheaderPortalId } from '../../../config'
import { TCACertificationProviderData, useGetTCACertificationMOCK, useLearnBreadcrumb, WaveHero } from '../learn-lib'
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
import { CertificationCurriculum } from './certification-curriculum'
import styles from './CertificationDetailsPage.module.scss'

function renderBasicList(items: Array<string>): ReactNode {
    return (
        <ul className='body-main'>
            {items.map(item => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    )
}

const CertificationDetailsPage: FC<{}> = () => {
    const routeParams: Params<string> = useParams()
    const { certification: dashedName }: Params<string> = routeParams
    const { initialized: profileReady }: ProfileContextData = useContext(profileContext)

    const {
        certification,
        ready: certificateReady,
    }: TCACertificationProviderData = useGetTCACertificationMOCK(dashedName as string)

    const ready: boolean = profileReady && certificateReady

    const breadcrumb: Array<BreadcrumbItemModel> = useLearnBreadcrumb([
        {

            name: textFormatGetSafeString(certification.title),
            url: '',
        },
    ])

    function renderLearningOutcomeSection(): ReactNode {
        return (
            <div className={styles['text-section']}>
                <h2>What I Will Learn?</h2>
                {renderBasicList(certification.learningOutcomes)}
            </div>
        )
    }

    function renderCertificationCurriculum(): ReactNode {
        return (
            <div className={styles['text-section']}>
                <CertificationCurriculum certification={certification} />
            </div>
        )
    }

    function renderRequirementsSection(): ReactNode {
        return (
            <div className={styles['text-section']}>
                <h2>Requirements</h2>
                {certification.prerequisites?.length ? (
                    renderBasicList(certification.prerequisites)
                ) : (
                    <p className='body-main'>
                        No prior knowledge in software development is required
                    </p>
                )}
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
        <ContentLayout
            contentClass={styles.contentWrap}
            outerClass={styles.outerContentWrap}
            innerClass={styles.innerContentWrap}
        >
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
                            <HeroTitle certification={certification} certTitle={certification.title} />
                        )}
                        theme='grey'
                        text={certification.introText}
                    >
                        <Button
                            buttonStyle='primary'
                            size='md'
                            label='Enroll Now'
                        />
                    </WaveHero>
                    <CertificationDetailsSidebar certification={certification} />
                </div>
            </Portal>

            <PerksSection items={perks} />
            {renderLearningOutcomeSection()}
            {renderCertificationCurriculum()}
            {renderRequirementsSection()}
            {renderFaqSection()}
        </ContentLayout>
    )
}

export default CertificationDetailsPage
