import { FC } from 'react'

import { LinkButton } from '~/libs/ui'

import { CourseTitle, LearnCourse, TCACertification, TitleBadgeType } from '../../lib'
import { getTCACertificationPath } from '../../learn.routes'
import { ReactComponent as StarsSvg } from '../stars.svg'
import styles from '../CourseCompletedPage.module.scss'

interface TCACertificationViewProps {
    courseData: LearnCourse
    certification?: TCACertification
    // eslint-disable-next-line react/no-unused-prop-types
    certificationParam: string
    // eslint-disable-next-line react/no-unused-prop-types
    userHandle?: string
}

const TCACertificationView: FC<TCACertificationViewProps> = (props: TCACertificationViewProps) => (
    <div className={styles['content-wrap']}>
        <h1>Congratulations!</h1>
        <hr />
        <div className='body-large'>
            You have successfully completed all Assessments for the&nbsp;
            <strong>{props.courseData.title}</strong>
            &nbsp;course.
            By completing the course you have also fulfilled all requirements for:
        </div>
        <div className={styles['course-title']}>
            <StarsSvg />
            <CourseTitle
                badgeType={TitleBadgeType.tcaCertification}
                learnLevel={props.certification?.learnerLevel}
                size='xl'
                title={props.certification?.title ?? ''}
                providers={props.certification?.resourceProviders}
                trackType={props.certification?.certificationCategory?.track}
            />
        </div>
        <hr />
        <p className='body-main'>
            What&apos;s next?
            Follow the link below to view and share your certification with prospective employers or friends.
        </p>
        <div className={styles['btns-wrap']}>
            <LinkButton
                size='md'
                primary
                label='View the certification details'
                to={getTCACertificationPath(props.certification?.dashedName ?? '')}
            />
        </div>
    </div>
)

export default TCACertificationView
