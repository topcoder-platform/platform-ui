import { FC } from 'react'

import { IconOutline } from '../../../../lib'
import { TCACertification } from '../../learn-lib'

import { CertificationSummary } from './certification-summary'
import { AssessmentCard, CourseCard } from './curriculum-cards'
import styles from './CertificationCurriculum.module.scss'

interface CertificationCurriculumProps {
    certification: TCACertification
}

const CertificationCurriculum: FC<CertificationCurriculumProps> = (props: CertificationCurriculumProps) => (
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
            <div className={styles.courses}>
                <CourseCard certification={{} as any} />
                <CourseCard certification={{} as any} />
                <CourseCard certification={{} as any} />
                <AssessmentCard
                    title='Web Development Fundamentals Assessment'
                    trackType='DEV'
                />
            </div>
            <CertificationSummary certification={props.certification} />
        </div>
    </div>
)

export default CertificationCurriculum
