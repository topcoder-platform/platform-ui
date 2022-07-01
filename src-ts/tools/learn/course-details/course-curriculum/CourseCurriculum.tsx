import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import { Button } from '../../../../lib'
import {
    CourseOutline,
    LearnCourse,
    LearningHat,
    LearnLesson,
    LearnModule,
    LearnMyCertificationProgress
} from '../../learn-lib'
import { getFccLessonPath } from '../../learn.routes'

import styles from './CourseCurriculum.module.scss'
import { CurriculumSummary } from './curriculum-summary'
import { TcAcademyPolicyModal } from './tc-academy-policy-modal'

interface CourseCurriculumProps {
    course: LearnCourse
    progress?: LearnMyCertificationProgress
}

const CourseCurriculum: FC<CourseCurriculumProps> = (props: CourseCurriculumProps) => {
    const navigate: NavigateFunction = useNavigate()

    const [isTcAcademyPolicyModal, setIsTcAcademyPolicyModal]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const handleStartCourse: () => void = useCallback(() => {
        const current: Array<string> = (props.progress?.currentLesson ?? '').split('/')
        const course: LearnCourse = props.course
        const module: LearnModule = course.modules[0]
        const lesson: LearnLesson = module.lessons[0]

        const lessonPath: string = getFccLessonPath({
            course: course.certification,
            lesson: current[1] ?? lesson.dashedName,
            module: current[0] ?? module.meta.dashedName,
        })
        navigate(lessonPath)
    }, [props.course, props.progress])

    const status: string = props.progress?.status ?? 'init'
    const progress: number = props.progress?.completed ?? 0
    const inProgress: boolean = status === 'in-progress'
    const isCompleted: boolean = status === 'completed'

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
                    onClickMainBtn={() => setIsTcAcademyPolicyModal(true)}
                    progress={inProgress ? progress : 0}
                    completed={isCompleted}
                />

                <div className={styles['course-outline']}>
                    <CourseOutline course={props.course} />
                </div>
            </div>
            {isCompleted && (
                <div className={styles['bottom-link']}>
                    <Button
                        buttonStyle='link'
                        label='See all my learning'
                    />
                </div>
            )}

            <TcAcademyPolicyModal
                isOpen={isTcAcademyPolicyModal}
                onClose={() => setIsTcAcademyPolicyModal(false)}
                onConfirm={handleStartCourse}
            />
        </>
    )
}

export default CourseCurriculum
