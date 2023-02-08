import { Dispatch, FC, ReactNode, SetStateAction, useCallback, useContext, useEffect, useState } from 'react'
import { Params, useParams, useSearchParams } from 'react-router-dom'
import classNames from 'classnames'

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
import { LEARN_PATHS } from '../learn.routes'

import { HeroTitle } from './hero-title'
import { CertificationDetailsSidebar } from './certification-details-sidebar'
import { CertificationCurriculum } from './certification-curriculum'
import { EnrollCtaBtn } from './enroll-cta-btn'
import { EnrolledModal } from './enrolled-modal'
import { CertifDetailsContent, CertificationDetailsModal } from './certification-details-modal'
import styles from './CertificationDetailsPage.module.scss'

const CertificationDetailsPage: FC<{}> = () => {
    const routeParams: Params<string> = useParams()
    const { certification: dashedName }: Params<string> = routeParams
    const [searchParams]: [URLSearchParams, unknown] = useSearchParams()
    const { initialized: profileReady, profile }: ProfileContextData = useContext(profileContext)
    const isLoggedIn: boolean = profileReady && !!profile

    const [isEnrolledModalOpen, setIsEnrolledModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isCertifDetailsModalOpen, setCertifDetailsModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    // Fetch the User's progress for all the courses
    // so we can show their progress
    // even before they enroll with the certification
    const {
        progresses: certsProgress,
        ready: certsProgressReady,
    }: UserCertificationsProviderData = useGetUserCertifications()

    const {
        certification,
        ready: certificationReady,
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

    const ready: boolean = profileReady && certificationReady && (!profile || (progressReady && certsProgressReady))

    const isEnrolled: boolean = progressReady && !!progress
    const isNotEnrolledView: boolean = !progressReady || !progress

    const breadcrumb: Array<BreadcrumbItemModel> = useLearnBreadcrumb([
        {

            name: textFormatGetSafeString(certification?.title),
            url: '',
        },
    ])

    /**
     * TODO: should launch the enrollment process, it SHOULD NOT call enroll api directly!
     */
    const startEnrollFlow: () => void = useCallback((): void => {
        if (!profile) {
            return
        }

        enrollTCACertificationAsync(`${profile.userId}`, `${certification.id}`)
            .then(d => {
                setIsEnrolledModalOpen(true)
                setCertificateProgress(d)
            })
    }, [certification?.id, profile, setCertificateProgress])

    function renderCertificationCurriculum(): ReactNode {
        return (
            <div className={classNames(styles['text-section'], isEnrolled && styles['no-top'])}>
                <CertificationCurriculum
                    certification={certification}
                    isEnrolled={isEnrolled}
                    certsProgress={certsProgress}
                />
            </div>
        )
    }

    function closeEnrolledModal(): void {
        setIsEnrolledModalOpen(false)
    }

    function toggleCertifDetailsModal(): void {
        setCertifDetailsModalOpen(d => !d)
    }

    /**
     * If the url has a "start-course" search param,
     * proceed as if the user just clicked "Start course" button
     */
    useEffect(() => {
        if (
            progressReady
            && isLoggedIn
            // eslint-disable-next-line no-null/no-null
            && searchParams.get(LEARN_PATHS.enrollCertifRouteFlag) !== null
            && (!progress || progress.status !== 'enrolled')
        ) {
            startEnrollFlow()
        }
    }, [startEnrollFlow, isLoggedIn, progressReady, progress?.status, searchParams])

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
                                <EnrollCtaBtn onEnroll={startEnrollFlow} />
                            )}
                        </WaveHero>
                        <CertificationDetailsSidebar
                            certification={certification}
                            enrolled={isEnrolled}
                            onEnroll={startEnrollFlow}
                        />
                    </div>
                </Portal>

                {isNotEnrolledView ? (
                    <CertifDetailsContent certification={certification} sectionClassName={styles['text-section']}>
                        {renderCertificationCurriculum()}
                    </CertifDetailsContent>
                ) : (
                    <>
                        {renderCertificationCurriculum()}
                        <div className={styles['text-section']}>
                            <Button
                                buttonStyle='link'
                                label='Certification Details'
                                onClick={toggleCertifDetailsModal}
                            />
                        </div>
                    </>
                )}
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

            <EnrolledModal
                isOpen={isEnrolledModalOpen}
                onClose={closeEnrolledModal}
            />

            {certificationReady && (
                <CertificationDetailsModal
                    isOpen={isCertifDetailsModalOpen}
                    onClose={toggleCertifDetailsModal}
                    certification={certification}
                />
            )}
        </ContentLayout>
    )
}

export default CertificationDetailsPage
