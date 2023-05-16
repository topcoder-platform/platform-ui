import { Dispatch, MutableRefObject, ReactNode, SetStateAction, useState } from "react"
import { CertificateBadgeIcon, CourseBadge, LearnUserCertificationProgress, TCACertificatePreview, TCACertification, TCACertificationEnrollmentBase } from "~/apps/learn/src/lib"
import { CertificateModal } from "~/apps/learn/src/lib/components/hiring-manager-view/certificate-modal"
import { getTCACertificationValidationUrl } from "~/apps/learn/src/learn.routes"
import { UserProfile, useUserCompletedCertifications } from "~/libs/core"
import { BaseModal, TCALogo } from "~/libs/ui"

import styles from './MemberTCAInfo.module.scss'
import { CertificateView } from "~/apps/learn/src/course-certificate/certificate-view"

interface MemberTCAInfoProps {
    profile: UserProfile | undefined
}

const MemberTCAInfo: React.FC<MemberTCAInfoProps> = (props: MemberTCAInfoProps) => {
    const { profile } = props

    const { data: memberTCA } = useUserCompletedCertifications(profile?.userId)

    const [certPreviewModalIsOpen, setCertPreviewModalIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [selectedCertification, setSelectedCertification]: [TCACertificationEnrollmentBase | undefined, Dispatch<SetStateAction<TCACertificationEnrollmentBase | undefined>>]
        = useState<TCACertificationEnrollmentBase | undefined>(undefined)

    const validateLink: string = getTCACertificationValidationUrl(selectedCertification?.completionUuid as string)

    const [coursePreviewModalIsOpen, setCoursePreviewModalIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [selectedCourse, setSelectedCourse]: [LearnUserCertificationProgress | undefined, Dispatch<SetStateAction<LearnUserCertificationProgress | undefined>>]
        = useState<LearnUserCertificationProgress | undefined>(undefined)

    function renderTCACertificatePreview(ref?: MutableRefObject<HTMLDivElement | any>): ReactNode {
        return (
            <TCACertificatePreview
                certification={selectedCertification?.topcoderCertification as TCACertification}
                userName={selectedCertification?.userName || profile?.handle}
                completedDate={selectedCertification?.completedAt as string}
                completionUuid={selectedCertification?.completionUuid as string}
                validateLink={validateLink}
                certificateElRef={ref}
                maxScale={Math.min()}
            />
        )
    }

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

    return memberTCA ? (
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
                                    <div className={styles.certificationCard} onClick={() => onCertClick(enrollment)} key={enrollment.completionUuid}>
                                        <CertificateBadgeIcon
                                            level={enrollment.topcoderCertification?.learnerLevel || 'Beginner'}
                                            type={enrollment.topcoderCertification?.certificationCategory.track || 'DEV'}
                                        />
                                        <div className={styles.certificationTitle}>{enrollment.topcoderCertification?.title}</div>
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
                        <div className={styles.certificationCard} onClick={() => onCourseClick(course)} key={course.courseKey}>
                            <CourseBadge type={course.certificationTrackType} />
                            <div className={styles.certificationTitle}>{course.certificationTitle}</div>
                        </div>
                    ))
                }
            </div>

            {certPreviewModalIsOpen && (
                <CertificateModal open onClose={handleHideCertPreviewModal}>
                    {renderTCACertificatePreview()}
                </CertificateModal>
            )}

            {coursePreviewModalIsOpen && (
                <BaseModal
                    onClose={handleHideCoursePreviewModal}
                    open
                    size='body'
                    theme='clear'
                >
                    <CertificateView
                        certification={selectedCourse?.certification as string}
                        profile={profile as UserProfile}
                        provider={selectedCourse?.resourceProvider.name as string}
                        fullScreenCertLayout
                    />
                </BaseModal>
            )}
        </div>
    ) : <></>
}

export default MemberTCAInfo
