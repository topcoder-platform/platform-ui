import { FC, useMemo } from 'react'
import { get } from 'lodash'

import { IconOutline } from '../../../../lib'
import {
    LearnUserCertificationProgress,
    TCACertification,
    TCACertificationProvider,
} from '../../learn-lib'

import { CertificationSummary } from './certification-summary'
import { AssessmentCard, CourseCard } from './curriculum-cards'
import styles from './CertificationCurriculum.module.scss'

interface CertificationCurriculumProps {
    certification: TCACertification
    certsProgress?: ReadonlyArray<LearnUserCertificationProgress>
    isEnrolled: boolean
}

interface ProgressByIdCollection {
    [key: string]: LearnUserCertificationProgress
}

interface ProvidersByIdCollection {
    [key: string]: TCACertificationProvider
}

const CertificationCurriculum: FC<CertificationCurriculumProps> = (props: CertificationCurriculumProps) => {
    const progressById: ProgressByIdCollection = useMemo(() => (
        props.certsProgress?.reduce((all, progress) => {
            all[progress.certificationId] = progress
            return all
        }, {} as ProgressByIdCollection) ?? {}
    ), [props.certsProgress])

    const providersById: ProvidersByIdCollection = useMemo(() => (
        props.certification.resourceProviders.reduce((all, provider) => {
            all[provider.id] = provider
            return all
        }, {} as ProvidersByIdCollection)
    ), [props.certification])

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
                        <strong>{props.certification.coursesCount}</strong>
                        <span>courses</span>
                    </div>
                    <div className={styles.headlineDetailsItem}>
                        <div className={styles.icon}>
                            <IconOutline.CalendarIcon />
                        </div>
                        <strong>{props.certification.estimatedCompletionTime}</strong>
                        <span>hours</span>
                    </div>
                </div>
            </div>

            <div className={styles.container}>
                <div className={styles.courses}>
                    {props.certification.certificationResources.map(cert => (
                        <CourseCard
                            certification={cert.freeCodeCampCertification}
                            progress={progressById[cert.freeCodeCampCertification.fccId]}
                            key={cert.id}
                            learnerLevel={cert.freeCodeCampCertification.learnerLevel}
                            provider={get(providersById, [cert.resourceProviderId, 'name'])}
                            isEnrolled={props.isEnrolled}
                        />
                    ))}
                    <AssessmentCard
                        title={`${props.certification.title} Assessment`}
                        trackType={props.certification.certificationCategory.track}
                    />
                </div>
                <CertificationSummary certification={props.certification} />
            </div>
        </div>
    )
}

export default CertificationCurriculum
