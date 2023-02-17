import { Dispatch, FC, ReactNode, SetStateAction, useContext, useState } from 'react'
import { Params, useParams } from 'react-router-dom'
import classNames from 'classnames'

import {
    TCACertificationProgressProviderData,
    TCACertificationProviderData,
    useGetTCACertification,
    useGetTCACertificationProgress,
    useGetUserCertifications,
    UserCertificationsProviderData,
} from '../learn-lib'
import {
    Button,
    profileContext,
    ProfileContextData,
} from '../../../lib'

import { CertificationDetailsSidebar } from './certification-details-sidebar'
import { CertificationCurriculum } from './certification-curriculum'
import { EnrollCtaBtn } from './enroll-cta-btn'
import { CertifDetailsContent, CertificationDetailsModal } from './certification-details-modal'
import { PageLayout } from './page-layout'
import styles from './CertificationDetailsPage.module.scss'

const CertificationDetailsPage: FC<{}> = () => {
    const routeParams: Params<string> = useParams()
    const { certification: dashedName }: Params<string> = routeParams
    const { initialized: profileReady, profile }: ProfileContextData = useContext(profileContext)

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
    }: TCACertificationProgressProviderData = useGetTCACertificationProgress(
        profile?.userId as unknown as string,
        dashedName as string,
        { enabled: profileReady && !!profile },
    )

    const ready: boolean = profileReady && certificationReady && (!profile || (progressReady && certsProgressReady))

    const isEnrolled: boolean = progressReady && !!progress
    const isNotEnrolledView: boolean = !progressReady || !progress

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

    function toggleCertifDetailsModal(): void {
        setCertifDetailsModalOpen(d => !d)
    }

    function renderMainContent(): ReactNode {
        return ready ? (
            isNotEnrolledView ? (
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
                    <CertificationDetailsModal
                        isOpen={isCertifDetailsModalOpen}
                        onClose={toggleCertifDetailsModal}
                        certification={certification}
                    />
                </>
            )
        ) : null
    }

    function renderSidebar(): ReactNode {
        return (
            <CertificationDetailsSidebar
                certification={certification}
                enrolled={isEnrolled}
                profile={profile}
                certProgress={progress}
            />
        )
    }

    return (
        <PageLayout
            sidebarContents={renderSidebar()}
            mainContent={renderMainContent()}
            certification={certification}
            heroCTA={!isEnrolled && (
                <EnrollCtaBtn certification={certification?.dashedName} />
            )}
        />
    )
}

export default CertificationDetailsPage
