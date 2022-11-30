import { FC } from 'react'
import classNames from 'classnames'

import { IconOutline, textFormatDateLocaleShortString } from '../../../../../../lib'
import { CourseBadge, LearnCertificateTrackType } from '../../../../learn-lib'

import styles from './CourseCard.module.scss'

interface CourseCardProps {
    completedDate?: string
    course?: string
    type: LearnCertificateTrackType
}

const CourseCard: FC<CourseCardProps> = (props: CourseCardProps) => (
    <div className={styles.wrap}>
        <div className={styles['top-wrap']}>
            <div className={styles.badge}>
                <CourseBadge type={props.type} asImg />
            </div>
            <h5 className={classNames('details', styles['course-title'])}>
                {props.course}
            </h5>
        </div>
        <div className={styles.details}>
            <IconOutline.CalendarIcon />
            <span className='large-subtitle'>
                <span>Completed</span>
                <span>
                    {
                        props.completedDate && (
                            textFormatDateLocaleShortString(new Date(props.completedDate))
                        )
                    }
                </span>
            </span>
        </div>
    </div>
)

export default CourseCard
