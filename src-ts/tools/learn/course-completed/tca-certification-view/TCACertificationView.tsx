import { FC } from 'react'

import { EnvironmentConfig } from '../../../../config'
import { Button } from '../../../../lib'
import { CourseTitle, LearnCourse, TCACertification } from '../../learn-lib'
import { getCertificatePath, getTCACertificationPath, rootRoute } from '../../learn.routes'
import { ReactComponent as StarsSvg } from '../stars.svg'
import { TitleBadgeType } from '../../learn-lib/course-title/CourseTitle'
import styles from '../CourseCompletedPage.module.scss'

interface TCACertificationViewProps {
    courseData: LearnCourse
    certification?: TCACertification
    certificationParam: string
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
            <Button
                size='sm'
                buttonStyle='primary'
                label='View the certification details'
                route={getTCACertificationPath(props.certification?.dashedName ?? '')}
            />
        </div>
    </div>
)

export default TCACertificationView
