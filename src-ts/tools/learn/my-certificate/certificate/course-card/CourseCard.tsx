import classNames from 'classnames'
import { FC } from 'react'

import { IconOutline, textFormatDateLocaleShortString } from '../../../../../lib'
import { CertificateTrackType } from '../certificate-track-type.enum'
import { CourseBadge } from '../course-badge'

import styles from './CourseCard.module.scss'

interface CourseCardProps {
    completedDate?: string
    course?: string
    type: CertificateTrackType
}

const CourseCard: FC<CourseCardProps> = (props: CourseCardProps) => {

    return (
        <div className={styles['wrap']}>
            <div className={styles['top-wrap']}>
                <CourseBadge type={props.type} />
                <h5 className={classNames('details', styles['course-title'])}>
                    {props.course}
                </h5>
            </div>
            <div className={styles['details']}>
                <IconOutline.CalendarIcon />
                <span className='large-subtitle'>
                    <span>Completed</span>
                    <span>{props.completedDate && textFormatDateLocaleShortString(new Date(props.completedDate))}</span>
                </span>
            </div>
        </div>
    )
}

export default CourseCard
