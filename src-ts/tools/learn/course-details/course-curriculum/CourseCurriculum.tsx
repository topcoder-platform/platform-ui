import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import { Button } from '../../../../lib'
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
import { getFccLessonPath, LEARN_PATHS } from '../../learn.routes'

import styles from './CourseCurriculum.module.scss'
import { CurriculumSummary } from './curriculum-summary'
import { TcAcademyPolicyModal } from './tc-academy-policy-modal'

interface CourseCurriculumProps {
    course: LearnCourse
    profileUserId?: number
    progress?: LearnMyCertificationProgress
}

const CourseCurriculum: FC<CourseCurriculumProps> = (props: CourseCurriculumProps) => {
    const navigate: NavigateFunction = useNavigate()

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
     * Check if user accepted policy when user clicks start course
     * If not, show the policy modal
     * otherwise resume(or start) the course
     */
    const handleStartCourseClick: () => void = useCallback(() => {
      if (props.progress?.academicHonestyPolicyAcceptedAt) {
        handleStartCourse()
        return
      }

      setIsTcAcademyPolicyModal(true)
    }, [handleStartCourse, props.progress?.academicHonestyPolicyAcceptedAt])

    /**
     * When user clicks accept inside the policy modal,
     * if there's no progress on the course yet, create the progress (this will also mark policy as accepted)
     * otherwise send a PUT request to expressly accept the policy
     */
    const handlePolicyAccept: () => void = useCallback(async () => {
        if (!props.profileUserId) {
            return
        }

        if (!props.progress?.id) {
            await startMyCertificationsProgressAsync(
                props.profileUserId,
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
        props.profileUserId,
        props.progress,
    ])

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
                />

                <div className={styles['course-outline']}>
                    <CourseOutline course={props.course} progress={props.progress} />
                </div>
            </div>
            {isCompleted && (
                <div className={styles['bottom-link']}>
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
