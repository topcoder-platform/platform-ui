import classNames from 'classnames'
import { FC } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import {
    Button,
    ProgressBar,
    textFormatDateLocaleShortString
} from '../../../../../lib'
import {
    CoursesProviderData,
    CourseTitle,
    LearnCertification,
    useCourses,
} from '../../../learn-lib'
import { getCoursePath, getLessonPathFromCurrentLesson } from '../../../learn.routes'
import { CurriculumSummary } from '../../curriculum-summary'

import styles from './InProgress.module.scss'

interface InProgressProps {
    certification?: LearnCertification
    completedPercentage: number
    currentLesson?: string
    startDate?: string
    theme: 'detailed' | 'minimum'
}

const InProgress: FC<InProgressProps> = (props: InProgressProps) => {

    const navigate: NavigateFunction = useNavigate()
    const isDetailed: boolean = props.theme === 'detailed'
    const isMinimum: boolean = props.theme === 'minimum'

    const certification: string = props.certification?.certification ?? ''
    const provider: string = props.certification?.providerName ?? ''
    const { course }: CoursesProviderData = useCourses(provider, certification)

    const resumeCourse: () => void = () => {
        if (!props.currentLesson) {
            return
        }

        const coursePath: string = getLessonPathFromCurrentLesson(
            provider,
            certification,
            props.currentLesson,
        )
        navigate(coursePath)
    }

    return (
        <div className={classNames(styles['wrap'], styles['large'])}>
            <div className={styles['inner']}>
                <div className={styles['line']}>
                    <CourseTitle
                        title={props.certification?.title ?? ''}
                        trackType={props.certification?.trackType}
                        credits={props.certification?.providerName}
                    >
                        {isDetailed && (
                            <div className={styles['status']}>In Progress</div>
                        )}
                    </CourseTitle>
                    {isMinimum && (
                        <Button
                            size='md'
                            buttonStyle='primary'
                            label='resume'
                            onClick={resumeCourse}
                            className='mobile-hide'
                        />
                    )}
                </div>

                <ProgressBar progress={props.completedPercentage} />
                {isMinimum && (
                    <Button
                        size='md'
                        buttonStyle='primary'
                        label='resume'
                        onClick={resumeCourse}
                        className='desktop-hide'
                    />
                )}

                {isDetailed && (
                    <div className={styles['summary']}>
                        <CurriculumSummary
                            moduleCount={course?.modules.length ?? 0}
                            completionHours={course?.estimatedCompletionTime}
                        />
                        <div className={styles['button']}>
                            <Button
                                buttonStyle='primary'
                                size='md'
                                label='Resume'
                                onClick={resumeCourse}
                            />
                        </div>
                    </div>
                )}
            </div>
            {isDetailed && (
                <div className={styles['details']}>
                    <div className={styles['details-inner']}>
                        <p dangerouslySetInnerHTML={{ __html: course?.introCopy.join('<br /><br />') ?? '' }}></p>
                        {props.startDate && (
                            <div className={styles['started-date']}>
                                <span>Started </span>
                                {textFormatDateLocaleShortString(new Date(props.startDate))}
                            </div>
                        )}
                        <Button
                            size='xs'
                            buttonStyle='secondary'
                            label='View Course'
                            route={getCoursePath(props.certification?.providerName ?? '', certification)}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default InProgress
