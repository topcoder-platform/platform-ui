import { Dispatch, FC, memo, SetStateAction, useEffect, useState } from 'react'
import classNames from 'classnames'

import { Button, ButtonStyle, FccLogoBlackSvg, IconSolid, ProgressBar } from '../../../../lib'
import {
    CompletionTimeRange,
    CourseBadge,
    LearnCertification,
    LearnLevelIcon,
    SkillTags,
    TCACertificationCompletionTimeRange,
    useHoursEstimateToRange,
    UserCertificationCompleted,
    UserCertificationInProgress,
} from '../../learn-lib'
import { getCertificatePath, getCoursePath, getLessonPathFromCurrentLesson } from '../../learn.routes'

import styles from './CoursesCard.module.scss'

interface CoursesCardProps {
    certification: LearnCertification
    userCompletedCertifications: ReadonlyArray<UserCertificationCompleted>
    userInProgressCertifications: ReadonlyArray<UserCertificationInProgress>
}

const EXCERPT_TEXT_LEN: number = 99

const CoursesCard: FC<CoursesCardProps> = (props: CoursesCardProps) => {
    const desc: string = props.certification.description?.slice(0, EXCERPT_TEXT_LEN)
    const [buttonLabel, setButtonLabel]: [string, Dispatch<SetStateAction<string>>]
        = useState<string>('')
    const [link, setLink]: [string, Dispatch<SetStateAction<string>>]
        = useState<string>('')
    const courseEnabled: boolean = props.certification.state === 'active'
    const [buttonStyle, setButtonStyle]: [string, Dispatch<SetStateAction<string>>]
        = useState<string>('secondary')
    const [courseProgress, setCourseProgress]: [number | undefined, Dispatch<SetStateAction<number | undefined>>]
        = useState<number | undefined>(undefined)
    const [linkCompleted, setLinkCompleted]: [string, Dispatch<SetStateAction<string>>]
        = useState<string>('')

    useEffect(() => {

        // if the course isn't enabled, there's nothing to do
        if (!courseEnabled) {
            return
        }

        // set the button text and link based on the progress of the user for this course
        const isCompleted: boolean = props.userCompletedCertifications
            .some(comp => comp.certificationId === props.certification.id)
        const inProgress: UserCertificationInProgress | undefined
            = props.userInProgressCertifications
                .find(i => i.certificationId === props.certification.id)

        if (isCompleted) {
            // if the course is completed, View the Certificate
            setButtonLabel('View Certificate')
            setButtonStyle('primary')
            setLink(getCertificatePath(
                props.certification.resourceProvider.name,
                props.certification.certification,
            ))
            setLinkCompleted(getCoursePath(
                props.certification.resourceProvider.name,
                props.certification.certification,
            ))

        } else if (!inProgress) {
            // if there is no in-progress lesson for the course,
            // Details by going to the course details
            setButtonLabel('Details')
            setLink(getCoursePath(
                props.certification.resourceProvider.name,
                props.certification.certification,
            ))

        } else {
            // otherwise this course is in-progress,
            // so Resume the course at the next lesson
            setButtonLabel('Resume')
            setButtonStyle('primary')
            setLink(getLessonPathFromCurrentLesson(
                props.certification.resourceProvider.name,
                props.certification.certification,
                inProgress.currentLesson,
            ))
            setCourseProgress(inProgress.courseProgressPercentage / 100)
        }
    }, [
        courseEnabled,
        props.certification,
        props.userCompletedCertifications,
        props.userInProgressCertifications,
    ])

    const completionTimeRange: TCACertificationCompletionTimeRange = useHoursEstimateToRange(
        props.certification.completionHours,
    )

    return (
        <div className={classNames(styles.wrap, !link && 'soon', linkCompleted && styles.completed)}>
            <div className={styles.cardHeader}>
                <CourseBadge type={props.certification.trackType ?? 'DEV'} />
                <div className={styles.cardHeaderTitleWrap}>
                    <p className='body-medium-medium'>{props.certification.title}</p>
                    <div className={styles.subTitleWrap}>
                        <LearnLevelIcon level={props.certification.learnerLevel} />
                        <span className={classNames('body-small', styles.infoText)}>
                            {props.certification.learnerLevel}
                        </span>
                        <IconSolid.DocumentTextIcon width={16} height={16} />
                        <em>
                            {props.certification.moduleCount}
                            {' modules'}
                        </em>
                        <IconSolid.ClockIcon width={16} height={16} />
                        <em>
                            <CompletionTimeRange range={completionTimeRange} />
                        </em>
                    </div>
                </div>
            </div>

            <div className={styles.cardHeaderDividerWrap}>
                {courseProgress === undefined ? linkCompleted ? undefined : (
                    <div className={styles.cardHeaderDivider} />
                ) : (
                    <ProgressBar progress={courseProgress} />
                )}
            </div>

            <p>
                {desc}
                {props.certification.description?.length > EXCERPT_TEXT_LEN ? '...' : ''}
            </p>

            <SkillTags
                courseKey={props.certification.course.key}
                expandCount={2}
                skills={props.certification.course.skills}
            />

            <div className={styles.cardBody}>
                <div className={styles.certProvider}>
                    {'by '}
                    <FccLogoBlackSvg />
                </div>
            </div>

            <div className={styles.cardBottom}>
                {!!link && (
                    <Button
                        buttonStyle={buttonStyle as ButtonStyle}
                        size='xs'
                        label={buttonLabel}
                        route={link}
                    />
                )}
                {linkCompleted && (
                    <Button
                        buttonStyle='secondary'
                        size='xs'
                        label='Details'
                        route={linkCompleted}
                    />
                )}
                {!courseEnabled && (
                    <h4 className='details'>Coming Soon</h4>
                )}
            </div>
        </div>
    )
}

export default memo(CoursesCard)
