import classNames from 'classnames'
import { FC, ReactNode } from 'react'

import { LearnCertificateTrackType } from '../all-certifications-provider'
import { CourseBadge } from '../course-badge'

import styles from './CourseTitle.module.scss'

interface CourseTitleProps {
    children?: ReactNode
    credits?: string
    size?: 'md'|'lg'|'xl'
    title: string
    trackType?: LearnCertificateTrackType
}

const CourseTitle: FC<CourseTitleProps> = (props: CourseTitleProps) => {

    const title: ReactNode = (!props.size || props.size === 'md') ? (
        <div className='body-main-bold'>
            {props.title}
        </div>
    ) : (
        <h1 className={classNames(props.size === 'lg' ? 'details' : '', props.size)}>
            {props.title}
        </h1>
    )

    return (
        <div className={classNames(styles['wrap'], props.size)}>
            <div className={classNames('badge-icon', props.size)}>
                <CourseBadge type={props.trackType ?? 'DEV'} />
            </div>
            <div className={styles['text']}>
                <div className={styles['title-row']}>
                    {title}
                    <span className='mobile-hide'>
                        {props.children}
                    </span>
                </div>
                {props.credits && (
                    <em className={classNames('quote-small', props.size)}>
                        by {props.credits}
                    </em>
                )}
                <span className='desktop-hide'>
                    {props.children}
                </span>
            </div>
        </div>
    )
}

export default CourseTitle
