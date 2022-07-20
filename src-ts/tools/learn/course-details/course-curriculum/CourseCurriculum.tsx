import classNames from 'classnames'
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react'
import { NavigateFunction, useNavigate, useSearchParams } from 'react-router-dom'

import { Button, UserProfile } from '../../../../lib'
import {
    CourseOutline,
    LearnCourse,
    LearningHat,
    LearnLesson,
    LearnModule,
    LearnMyCertificationProgress,
    MyCertificationProgressStatus,
    startMyCertificationsProgressAsync,
    UpdateMyCertificateProgressActions,
    updateMyCertificationsProgressAsync
} from '../../learn-lib'
import { authenticateAndStartCourseRoute, getFccLessonPath, LEARN_PATHS } from '../../learn.routes'

import styles from './CourseCurriculum.module.scss'
import { CurriculumSummary } from './curriculum-summary'
import { TcAcademyPolicyModal } from './tc-academy-policy-modal'

interface CourseCurriculumProps {
    course: LearnCourse
    profile?: UserProfile
    progress?: LearnMyCertificationProgress
    progressReady?: boolean
}

const CourseCurriculum: FC<CourseCurriculumProps> = (props: CourseCurriculumProps) => {
    const navigate: NavigateFunction = useNavigate()
    const [searchParams]: any = useSearchParams()

    const isLoggedIn: boolean = !!props.profile

    const [isTcAcademyPolicyModal, setIsTcAcademyPolicyModal]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const status: string = props.progress?.status ?? 'init'
    const completedPercentage: number = (props.progress?.courseProgressPercentage ?? 0) / 100
    const inProgress: boolean = status === MyCertificationProgressStatus.inProgress || !!props.progress?.currentLesson
    const isCompleted: boolean = status === MyCertificationProgressStatus.completed

    /**
     * Redirect user to the currentLesson if there's already some progress recorded
     * otherwise redirect to first module > first lesson
     */
    const handleStartCourse: () => void = useCallback(() => {
        const current: Array<string> = (props.progress?.currentLesson ?? '').split('/')
        const course: LearnCourse = props.course
        const module: LearnModule = course.modules[0]
        const lesson: LearnLesson = module.lessons[0]

        const lessonPath: string = getFccLessonPath(
            course.provider,
            course.certification,
            current[0] || module.meta.dashedName,
            current[1] || lesson.dashedName,
        )
        navigate(lessonPath)
    }, [props.course, props.progress, navigate])

    /**
     * Handle user click on start course/resume/login button
     */
    const handleStartCourseClick: () => void = useCallback(() => {
        // if user is not logged in, redirect to login page
        if (!isLoggedIn) {
            // add a flag to the return url to show the academic policy modal
            // or resume the course when they're back
            window.location.href = authenticateAndStartCourseRoute
            return
        }

        // Check if user accepted policy and resume(or start) the course
        if (props.progress?.academicHonestyPolicyAcceptedAt) {
            handleStartCourse()
            return
        }

        // show the academic policy modal before starting a new course
        setIsTcAcademyPolicyModal(true)
    }, [
        handleStartCourse,
        isLoggedIn,
        props.progress?.academicHonestyPolicyAcceptedAt,
    ])

    /**
     * When user clicks accept inside the policy modal,
     * if there's no progress on the course yet, create the progress (this will also mark policy as accepted)
     * otherwise send a PUT request to expressly accept the policy
     */
    const handlePolicyAccept: () => void = useCallback(async () => {
        if (!props.profile) {
            return
        }

        if (!props.progress?.id) {
            await startMyCertificationsProgressAsync(
                props.profile.userId,
                props.course.certificationId,
                props.course.id,
                {
                    lesson: props.course.modules[0].lessons[0].dashedName,
                    module: props.course.modules[0].meta.dashedName,
                }
            )
        } else {
            await updateMyCertificationsProgressAsync(
                props.progress.id,
                UpdateMyCertificateProgressActions.acceptHonestyPolicy,
                {}
            )
        }

        handleStartCourse()
    }, [
        handleStartCourse,
        props.course.certificationId,
        props.course.id,
        props.course.modules,
        props.profile,
        props.progress?.id,
    ])

    /**
     * If the url has a "start-course" search param,
     * proceed as if the user just clicked "Start course" button
     */
    useEffect(() => {
      if (props.progressReady && isLoggedIn && searchParams.get('start-course') !== null) {
        handleStartCourseClick()
      }
    }, [handleStartCourseClick, isLoggedIn, props.progressReady, searchParams])

    return (
        <>
            <div className={styles['wrap']}>
                <div className={styles['title']}>
                    {isCompleted && (
                        <>
                            <LearningHat />
                            <h2 className='details'>Congratulations!</h2>
                        </>
                    )}
                    {!isCompleted && (<h4 className='details'>Course Curriculum</h4>)}
                </div>

                <CurriculumSummary
                    course={props.course}
                    onClickMainBtn={handleStartCourseClick}
                    inProgress={inProgress}
                    completedPercentage={completedPercentage}
                    completed={isCompleted}
                    completedDate={props.progress?.completedDate}
                    isLoggedIn={isLoggedIn}
                />

                <div className={styles['course-outline']}>
                    <CourseOutline course={props.course} progress={props.progress} />
                </div>
            </div>
            {isCompleted && (
                <div className={classNames('mobile-hide', styles['bottom-link'])}>
                    <Button
                        buttonStyle='link'
                        label='See all my learning'
                        route={LEARN_PATHS.myLearning}
                    />
                </div>
            )}

            <TcAcademyPolicyModal
                isOpen={isTcAcademyPolicyModal}
                onClose={() => setIsTcAcademyPolicyModal(false)}
                onConfirm={handlePolicyAccept}
            />
        </>
    )
}

export default CourseCurriculum
