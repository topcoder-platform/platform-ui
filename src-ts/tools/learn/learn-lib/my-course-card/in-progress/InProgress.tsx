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
    LearnMyCertification,
    LearnMyCertificationProgress,
    useCoursesProvider,
} from '../../../learn-lib'
import { getCoursePath, getFccLessonPath } from '../../../learn.routes'
import { CurriculumSummary } from '../../curriculum-summary'

import styles from './InProgress.module.scss'

interface InProgressProps {
    certification: LearnMyCertification
    progress: LearnMyCertificationProgress
    theme: 'detailed'|'minimum'
}

const InProgress: FC<InProgressProps> = (props: InProgressProps) => {
    const navigate: NavigateFunction = useNavigate()
    const isDetailed: boolean = props.theme === 'detailed'
    const isMinimum: boolean = props.theme === 'minimum'

    const certification: string = props.certification.certification
    const {course}: CoursesProviderData = useCoursesProvider(props.certification.certification)

    const resumeCourse: () => void = () => {
        if (!props.progress.currentLesson) {
            return
        }

        const [module, lesson]: Array<string> = (props.progress.currentLesson ?? '').split('/')

        const coursePath: string = getFccLessonPath({
            course: certification,
            lesson,
            module,
        })
        navigate(coursePath)
    }

    return (
        <div className={classNames(styles['wrap'], styles['large'])}>
            <div className={styles['inner']}>
                <div className={styles['line']}>
                    <CourseTitle
                        title={props.certification.title}
                        type={props.certification.category}
                        credits={props.certification.providerName}
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
                        />
                    )}
                </div>

                <ProgressBar progress={props.progress.completed} />

                {isDetailed && (
                    <div className={styles['summary']}>
                        <CurriculumSummary
                            moduleCount={course?.modules.length ?? 0}
                            completionHours={course?.completionHours ?? 0}
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
                        <div className={styles['started-date']}>
                            <span>Started </span>
                            {textFormatDateLocaleShortString(new Date(props.progress.startedDate))}
                        </div>
                        <Button
                            size='xs'
                            buttonStyle='secondary'
                            label='View Course'
                            route={getCoursePath(certification)}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default InProgress
