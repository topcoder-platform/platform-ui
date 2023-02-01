import { FC, useMemo } from 'react'

import { IconOutline } from '../../../../lib'
import {
    AllCertificationsProviderData,
    LearnCertification,
    LearnUserCertificationProgress,
    TCACertification,
    TCACertificationLearnLevel,
    useGetAllCertifications,
    useGetUserCertifications,
    UserCertificationsProviderData,
} from '../../learn-lib'

import { CertificationSummary } from './certification-summary'
import { AssessmentCard, CourseCard } from './curriculum-cards'
import styles from './CertificationCurriculum.module.scss'

interface CertificationCurriculumProps {
    certification: TCACertification
}

interface CertificatesByIdType {
    [key: string]: LearnUserCertificationProgress
}

const CertificationCurriculum: FC<CertificationCurriculumProps> = (props: CertificationCurriculumProps) => {
    const {
        completed,
        inProgress,
        ready: userCertsReady,
    }: UserCertificationsProviderData = useGetUserCertifications()

    const {
        certifications: allCertifications,
        ready: certificatesReady,
    }: AllCertificationsProviderData = useGetAllCertifications()

    const progressById: CertificatesByIdType = useMemo(() => {
        const progresses: LearnUserCertificationProgress[] = [
            ...completed,
            ...inProgress,
        ]

        return (
            progresses.reduce((certifs, certificate) => {
                certifs[certificate.certificationId] = certificate
                return certifs
            }, {} as unknown as CertificatesByIdType)
        )
    }, [completed, inProgress])

    const certResources: {[key: string]: {learnerLevel: TCACertificationLearnLevel}} = useMemo(() => (
        Object.fromEntries(
            props.certification.certificationResources.map(d => [
                d.freeCodeCampCertification.fccId,
                d.freeCodeCampCertification,
            ]),
        )
    ), [props.certification.certificationResources])

    const certifications: LearnCertification[] = useMemo(() => (
        allCertifications.filter(cert => !!certResources[cert.id])
    ), [allCertifications, certResources])

    return (
        <div className={styles.wrap}>
            <div className={styles.headline}>
                <h2 className='details'>
                    Certification Curriculum
                </h2>
                <div className={styles.headlineDetails}>
                    <div className={styles.headlineDetailsItem}>
                        <div className={styles.icon}>
                            <IconOutline.DocumentTextIcon />
                        </div>
                        <strong>4</strong>
                        <span>courses</span>
                    </div>
                    <div className={styles.headlineDetailsItem}>
                        <div className={styles.icon}>
                            <IconOutline.CalendarIcon />
                        </div>
                        <strong>2</strong>
                        <span>months</span>
                    </div>
                </div>
            </div>

            <div className={styles.container}>
                {certificatesReady && userCertsReady && (
                    <div className={styles.courses}>
                        {certifications.map(cert => (
                            <CourseCard
                                certification={cert}
                                progress={progressById[cert.id]}
                                key={cert.id}
                                learnerLevel={certResources[cert.id]?.learnerLevel}
                            />
                        ))}
                        <AssessmentCard
                            title={`${props.certification.title} Assessment`}
                            trackType={props.certification.certificationCategory.track}
                        />
                    </div>
                )}
                <CertificationSummary certification={props.certification} />
            </div>
        </div>
    )
}

export default CertificationCurriculum