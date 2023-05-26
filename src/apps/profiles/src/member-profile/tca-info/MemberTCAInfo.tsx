import { Dispatch, SetStateAction, useState } from 'react'
import { bind } from 'lodash'

import { AppSubdomain, EnvironmentConfig } from '~/config'
import {
    CertificateBadgeIcon,
    CourseBadge,
    LearnUserCertificationProgress,
    TCACertificationEnrollmentBase,
} from '~/apps/learn/src/lib'
import { CertificateView } from '~/apps/learn/src/course-certificate/certificate-view'
import { UserCompletedCertificationsData, UserProfile, useUserCompletedCertifications } from '~/libs/core'
import { BaseModal, TCALogo } from '~/libs/ui'

import styles from './MemberTCAInfo.module.scss'

interface MemberTCAInfoProps {
    profile: UserProfile | undefined
}

const MemberTCAInfo: React.FC<MemberTCAInfoProps> = (props: MemberTCAInfoProps) => {
    const { data: memberTCA }: { data: UserCompletedCertificationsData | undefined }
        = useUserCompletedCertifications(props.profile?.userId)

    const [certPreviewModalIsOpen, setCertPreviewModalIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [selectedCertification, setSelectedCertification]: [
        TCACertificationEnrollmentBase | undefined, Dispatch<SetStateAction<TCACertificationEnrollmentBase | undefined>>
    ] = useState<TCACertificationEnrollmentBase | undefined>(undefined)

    const [coursePreviewModalIsOpen, setCoursePreviewModalIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [selectedCourse, setSelectedCourse]: [
        LearnUserCertificationProgress | undefined, Dispatch<SetStateAction<LearnUserCertificationProgress | undefined>>
    ] = useState<LearnUserCertificationProgress | undefined>(undefined)

    const tcaHiringManagerViewUrl: string
        // eslint-disable-next-line max-len
        = `https://${AppSubdomain.tcAcademy}.${EnvironmentConfig.TC_DOMAIN}/tca-certifications/${selectedCertification?.topcoderCertification?.dashedName}/${selectedCertification?.userHandle}/certification?view-style=modal`

    function onCertClick(enrollment: TCACertificationEnrollmentBase): void {
        setCertPreviewModalIsOpen(true)
        setSelectedCertification(enrollment)
    }

    function handleHideCertPreviewModal(): void {
        setCertPreviewModalIsOpen(false)
    }

    function onCourseClick(course: LearnUserCertificationProgress): void {
        setCoursePreviewModalIsOpen(true)
        setSelectedCourse(course)
    }

    function handleHideCoursePreviewModal(): void {
        setCoursePreviewModalIsOpen(false)
    }

    return memberTCA && (memberTCA.courses.length || memberTCA.enrollments.length) ? (
        <div className={styles.container}>
            <div className={styles.title}>
                <TCALogo />
                <h3>TOPCODER ACADEMY</h3>
            </div>

            {
                memberTCA.enrollments.length ? (
                    <>
                        <h4>CERTIFICATIONS</h4>
                        <div className={styles.certifications}>
                            {
                                memberTCA.enrollments.map(enrollment => (
                                    <div
                                        className={styles.certificationCard}
                                        onClick={bind(onCertClick, this, enrollment)}
                                        key={enrollment.completionUuid}
                                    >
                                        <CertificateBadgeIcon
                                            level={enrollment.topcoderCertification?.learnerLevel || 'Beginner'}
                                            type={
                                                enrollment.topcoderCertification?.certificationCategory.track || 'DEV'
                                            }
                                        />
                                        <div className={styles.certificationTitle}>
                                            {enrollment.topcoderCertification?.title}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </>
                ) : undefined
            }

            <h4>COURSES</h4>
            <div className={styles.certifications}>
                {
                    memberTCA.courses.map(course => (
                        <div
                            className={styles.certificationCard}
                            onClick={bind(onCourseClick, this, course)}
                            key={course.courseKey}
                        >
                            <CourseBadge type={course.certificationTrackType} />
                            <div className={styles.certificationTitle}>{course.certificationTitle}</div>
                        </div>
                    ))
                }
            </div>

            {certPreviewModalIsOpen && (
                <BaseModal
                    onClose={handleHideCertPreviewModal}
                    open
                    size='body'
                    theme='clear'
                    contentClassName={styles.certPreviewModalWrap}
                >
                    <iframe
                        className={styles.certPreviewModalIframe}
                        src={tcaHiringManagerViewUrl}
                        title={selectedCertification?.topcoderCertification?.title}
                    />
                </BaseModal>
            )}

            {coursePreviewModalIsOpen && (
                <BaseModal
                    onClose={handleHideCoursePreviewModal}
                    open
                    size='body'
                    title='TOPCODER ACADEMY'
                >
                    <CertificateView
                        certification={selectedCourse?.certification as string}
                        profile={props.profile as UserProfile}
                        provider={selectedCourse?.resourceProvider.name as string}
                        fullScreenCertLayout
                    />
                </BaseModal>
            )}
        </div>
    ) : <></>
}

export default MemberTCAInfo
