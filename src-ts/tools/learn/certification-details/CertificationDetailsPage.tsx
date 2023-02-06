import { FC, ReactNode, useContext } from 'react'
import { Params, useParams } from 'react-router-dom'

import { PageSubheaderPortalId } from '../../../config'
import {
    enrollTCACertificationAsync,
    TCACertificationProgressProviderData,
    TCACertificationProviderData,
    useGetTCACertification,
    useGetTCACertificationProgress,
    useGetUserCertifications,
    useLearnBreadcrumb,
    UserCertificationsProviderData,
    WaveHero,
} from '../learn-lib'
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
    const { initialized: profileReady, profile }: ProfileContextData = useContext(profileContext)

    // Fetch the User's progress for all the courses
    // so we can show their progress
    // even before they enroll with the certification
    const {
        progresses: certsProgress,
        ready: certsProgressReady,
    }: UserCertificationsProviderData = useGetUserCertifications()

    const {
        certification,
        ready: certificateReady,
    }: TCACertificationProviderData = useGetTCACertification(dashedName as string)

    // Fetch Enrollment status & progress
    const {
        progress,
        ready: progressReady,
        setCertificateProgress,
    }: TCACertificationProgressProviderData = useGetTCACertificationProgress(
        profile?.userId as unknown as string,
        dashedName as string,
        { enabled: profileReady && !!profile },
    )

    const ready: boolean = profileReady && certificateReady && (!profile || (progressReady && certsProgressReady))

    const isEnrolled: boolean = progressReady && !!progress

    const breadcrumb: Array<BreadcrumbItemModel> = useLearnBreadcrumb([
        {

            name: textFormatGetSafeString(certification?.title),
            url: '',
        },
    ])

    /**
     * TODO: should launch the enrollment process, it SHOULD NOT call enroll api directly!
     */
    function handleEnrollClick(): void {
        if (!profile) {
            return
        }

        enrollTCACertificationAsync(`${profile.userId}`, `${certification.id}`)
            .then(d => {
                setCertificateProgress(d)
            })
    }

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
                <CertificationCurriculum
                    certification={certification}
                    isEnrolled={isEnrolled}
                    certsProgress={certsProgress}
                />
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

    function renderContents(): ReactNode {
        return (
            <>
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
                            {!isEnrolled && (
                                <Button
                                    buttonStyle='primary'
                                    size='md'
                                    label='Enroll Now'
                                    onClick={handleEnrollClick}
                                />
                            )}
                        </WaveHero>
                        <CertificationDetailsSidebar
                            certification={certification}
                            enrolled={isEnrolled}
                            onEnroll={handleEnrollClick}
                        />
                    </div>
                </Portal>

                <PerksSection items={perks} />
                {renderLearningOutcomeSection()}
                {renderCertificationCurriculum()}
                {renderRequirementsSection()}
                {renderFaqSection()}
            </>
        )
    }

    return (
        <ContentLayout
            contentClass={styles.contentWrap}
            outerClass={styles.outerContentWrap}
            innerClass={styles.innerContentWrap}
        >
            {!ready ? (
                <div className={styles.wrap}>
                    <LoadingSpinner />
                </div>
            ) : renderContents()}
        </ContentLayout>
    )
}

export default CertificationDetailsPage
