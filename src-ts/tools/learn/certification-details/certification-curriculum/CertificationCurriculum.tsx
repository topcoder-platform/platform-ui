import { FC, useMemo } from 'react'
import { get, orderBy } from 'lodash'

import { IconOutline } from '../../../../lib'
import {
    CompletionTimeRange,
    LearnUserCertificationProgress,
    TCACertification,
    TCACertificationProvider,
    TCACertificationResource,
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

    const sortedCertResources: TCACertificationResource[] = useMemo(() => (
        orderBy(props.certification.certificationResources, 'displayOrder')
    ), [props.certification.certificationResources])

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
                        <strong>
                            <CompletionTimeRange range={props.certification.completionTimeRange} />
                        </strong>
                    </div>
                </div>
            </div>

            <div className={styles.container}>
                <div className={styles.courses}>
                    {sortedCertResources.map(cert => (
                        <CourseCard
                            certification={cert.freeCodeCampCertification}
                            course={cert.freeCodeCampCertification?.course}
                            progress={progressById[cert.freeCodeCampCertification.fccId]}
                            key={cert.id}
                            learnerLevel={cert.freeCodeCampCertification.learnerLevel}
                            provider={get(providersById, [cert.resourceProviderId, 'name'])}
                            isEnrolled={props.isEnrolled}
                            tcaCertification={props.certification}
                        />
                    ))}
                    <AssessmentCard
                        title={`${props.certification.title} Assessment`}
                        trackType={props.certification.certificationCategory.track}
                    />
                </div>
                <CertificationSummary
                    certification={props.certification}
                />
            </div>
        </div>
    )
}

export default CertificationCurriculum
