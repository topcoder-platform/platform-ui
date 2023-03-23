import { FC } from 'react'

import { EnvironmentConfig } from '../../../../config'
import { Button } from '../../../../lib'
import { CourseTitle, LearnCertification, LearnCourse } from '../../learn-lib'
import { getCertificatePath, rootRoute } from '../../learn.routes'
import { ReactComponent as StarsSvg } from '../stars.svg'
import styles from '../CourseCompletedPage.module.scss'

interface CourseViewProps {
    courseData: LearnCourse
    certification?: LearnCertification
    certificationParam: string
    userHandle?: string
}

const CourseView: FC<CourseViewProps> = (props: CourseViewProps) => (
    <div className={styles['content-wrap']}>
        <h1>Congratulations!</h1>
        <hr />
        <div className='body-large'>
            You have successfully completed all Assessments for
        </div>
        <div className={styles['course-title']}>
            <StarsSvg />
            <CourseTitle
                size='xl'
                title={props.courseData.title}
                provider={props.courseData.resourceProvider.name}
                trackType={props.certification?.certificationCategory?.track}
            />
        </div>
        <hr />
        <p className='body-main'>
            Now that you have completed the
            {' '}
            {props.courseData.title}
            ,
            take a look at our other Topcoder Academy courses.
            To view other courses, press the  &quot;Start a new course&quot; button below.
        </p>
        <div className={styles['btns-wrap']}>
            <Button
                size='sm'
                buttonStyle='secondary'
                label='View certificate'
                route={(
                    getCertificatePath(
                        props.courseData.resourceProvider.name,
                        props.certificationParam,
                    )
                )}
            />
            <Button
                size='sm'
                buttonStyle='primary'
                label='Start a new course'
                route={rootRoute}
            />
        </div>
        <p className='body-main'>
            Completed courses in the Academy will reflect on your Topcoder profile.
            This will make your Topcoder profile more attractive to potential employers
            via Gig work, and shows the community how well you&apos;ve progressed in completing
            learning courses.
        </p>
        <div className={styles['btns-wrap']}>
            <Button
                buttonStyle='link'
                label='See your updated profile'
                url={`${EnvironmentConfig.TOPCODER_URLS.USER_PROFILE}/${props.userHandle}`}
                target='_blank'
            />
        </div>
    </div>
)

export default CourseView