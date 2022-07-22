import classNames from 'classnames'
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'

import { Button } from '../../../../lib'
import {
    CourseTitle,
    LearnCertification,
    MyCertificationCompleted,
    MyCertificationInProgress,
} from '../../learn-lib'
import { getCertificatePath, getCoursePath, getLessonPathFromCurrentLesson } from '../../learn.routes'

import styles from './CoursesCard.module.scss'

interface CoursesCardProps {
    certification: LearnCertification
    myCompletedCertifications: Array<MyCertificationCompleted>
    myInProgressCertifications: Array<MyCertificationInProgress>
}

const CoursesCard: FC<CoursesCardProps> = (props: CoursesCardProps) => {

    const [buttonLabel, setButtonLabel]: [string, Dispatch<SetStateAction<string>>]
        = useState<string>('')
    const [link, setLink]: [string, Dispatch<SetStateAction<string>>]
        = useState<string>('')

    const courseEnabled: boolean = props.certification.state === 'active'
    useEffect(() => {

        // if the course isn't enabled, there's nothing to do
        if (!courseEnabled) {
            return
        }

        // set the button text and link based on the progress of the user for this course
        const isCompleted: boolean = props.myCompletedCertifications
            .some(comp => comp.certificationId === props.certification.id)
        const inProgress: MyCertificationInProgress | undefined
            = props.myInProgressCertifications
                .find(i => i.certificationId === props.certification.id)

        if (isCompleted) {
            // if the course is completed, View the Certificate
            setButtonLabel('View Certificate')
            setLink(getCertificatePath(
                props.certification.providerName,
                props.certification.certification
            ))

        } else if (!inProgress) {
            // if there is no in-progress lesson for the course, Get Started by going to the course details
            setButtonLabel('Get Started')
            setLink(getCoursePath(
                props.certification.providerName,
                props.certification.certification
            ))

        } else {
            // otherwise this course is in-progress, so Resume the course at the next lesson
            setButtonLabel('Resume')
            setLink(getLessonPathFromCurrentLesson(
                props.certification.providerName,
                props.certification.certification,
                inProgress.currentLesson
            ))
        }
    }, [
        courseEnabled,
        getCertificatePath,
        getCoursePath,
        getLessonPathFromCurrentLesson,
        props.certification,
        props.myCompletedCertifications,
        props.myInProgressCertifications,
        setButtonLabel,
        setLink,
    ])

    return (
        <div className={classNames(styles['wrap'], !link && 'soon')}>
            <div className='overline'>
                {props.certification.category}
            </div>
            <CourseTitle
                credits={props.certification.providerName}
                title={props.certification.title}
                type={props.certification.category}
            />
            <div className={styles['bottom']}>
                {!!link && (
                    <Button
                        buttonStyle='primary'
                        size='sm'
                        label={buttonLabel}
                        route={link}
                    />
                )}
                {!courseEnabled && (
                    <h4 className='details'>Coming Soon</h4>
                )}
            </div>
        </div>
    )
}

export default CoursesCard
