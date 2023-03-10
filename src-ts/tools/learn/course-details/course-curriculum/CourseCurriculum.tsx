import { noop } from 'lodash'
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react'
import { NavigateFunction, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { UserProfile } from '../../../../lib'
import {
    CourseOutline,
    LearnCourse,
    LearningHat,
    LearnLesson,
    LearnModule,
    LearnUserCertificationProgress,
    userCertificationProgressStartAsync,
    UserCertificationProgressStatus,
    userCertificationProgressUpdateAsync,
    UserCertificationUpdateProgressActions,
} from '../../learn-lib'
import {
    getAuthenticateAndStartCourseRoute,
    getCertificatePath,
    getLessonPathFromCurrentLesson,
    LEARN_PATHS,
} from '../../learn.routes'

import { CurriculumSummary } from './curriculum-summary'
import { TcAcademyPolicyModal } from './tc-academy-policy-modal'
import { DiceModal } from './dice-modal'
import styles from './CourseCurriculum.module.scss'

interface CourseCurriculumProps {
    certification: string
    course: LearnCourse
    profile?: UserProfile
    progress?: LearnUserCertificationProgress
    progressReady?: boolean
    setCertificateProgress: (d: LearnUserCertificationProgress) => void
}

const CourseCurriculum: FC<CourseCurriculumProps> = (props: CourseCurriculumProps) => {

    const navigate: NavigateFunction = useNavigate()
    const [searchParams]: [URLSearchParams, unknown] = useSearchParams()

    const isLoggedIn: boolean = !!props.profile

    const [isTcAcademyPolicyModal, setIsTcAcademyPolicyModal]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isDiceModalOpen, setIsDiceModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const status: string = props.progress?.status ?? UserCertificationProgressStatus.inititialized
    const completedPercentage: number = (props.progress?.courseProgressPercentage ?? 0) / 100
    const inProgress: boolean = status === UserCertificationProgressStatus.inProgress
    const isCompleted: boolean = status === UserCertificationProgressStatus.completed

    const location: any = useLocation()

    /**
     * Redirect user to the currentLesson if there's already some progress recorded
     * otherwise redirect to first module > first lesson
     */
    const handleStartCourse: () => void = useCallback(() => {

        const course: LearnCourse = props.course
        const module: LearnModule = course.modules[0]
        const lesson: LearnLesson = module.lessons[0]

        const lessonPath: string = getLessonPathFromCurrentLesson(
            course.resourceProvider.name,
            props.certification,
            props.progress?.currentLesson,
            module.dashedName,
            lesson.dashedName,
        )
        navigate(lessonPath, {
            state: location.state,
        })
    }, [
        location.state,
        navigate,
        props.certification,
        props.course,
        props.progress,
    ])

    /**
     * Handle user click on start course/resume/login button
     */
    const handleStartCourseClick: () => void = useCallback(() => {

        // if user is not logged in, redirect to login page
        if (!isLoggedIn) {
            // add a flag to the return url to show the academic policy modal
            // or resume the course when they're back
            window.location.href = getAuthenticateAndStartCourseRoute()
            return
        }

        // if the user is wipro and s/he hasn't set up DICE,
        // let the user know
        if (props.profile?.isWipro && !props.profile.diceEnabled) {
            setIsDiceModalOpen(true)
            return
        }

        // Check if user accepted policy and resume(or start) the course
        if (props.progress?.academicHonestyPolicyAcceptedAt) {
            handleStartCourse()
            return
        }

        // show the academic policy modal before starting a new course
        setIsTcAcademyPolicyModal(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

        let progress: LearnUserCertificationProgress | undefined = props.progress
        // start and mark progress object as "in progress"
        progress = await userCertificationProgressStartAsync(
            props.profile.userId,
            props.course.certificationId,
            props.course.id,
            {
                lesson: props.course.modules[0].lessons[0].dashedName,
                module: props.course.modules[0].dashedName,
            },
        )

        progress = await userCertificationProgressUpdateAsync(
            progress!.id,
            UserCertificationUpdateProgressActions.acceptHonestyPolicy,
            {},
        )

        // update progress with data returned from calling the start progress endpoint
        props.setCertificateProgress(progress)

        handleStartCourse()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        handleStartCourse,
        props.course.certificationId,
        props.course.id,
        props.course.modules,
        props.profile,
        props.progress?.id,
    ])

    function handleNavigateToCertificate(): void {
        const certificatePath: string = getCertificatePath(
            props.course.resourceProvider.name,
            props.certification,
        )
        navigate(certificatePath)
    }

    /**
     * If the url has a "start-course" search param,
     * proceed as if the user just clicked "Start course" button
     */
    useEffect(() => {
        // eslint-disable-next-line no-null/no-null
        if (props.progressReady && isLoggedIn && searchParams.get(LEARN_PATHS.startCourseRouteFlag) !== null) {
            handleStartCourseClick()
        }
    }, [handleStartCourseClick, isLoggedIn, props.progressReady, searchParams])

    function onAcademicHonestyModalClose(): void {
        setIsTcAcademyPolicyModal(false)
    }

    function onDiceModalClose(): void {
        setIsDiceModalOpen(false)
    }

    return (
        <>
            <div className={styles.wrap}>
                <div className={styles.title}>
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
                    onClickCertificateBtn={handleNavigateToCertificate}
                    isLoggedIn={isLoggedIn}
                />

                <div className={styles['course-outline']}>
                    <CourseOutline
                        certification={props.certification}
                        course={props.course}
                        progress={props.progress}
                        currentStep={props.progress?.currentLesson}
                        onItemNavigate={noop}
                    />
                </div>
            </div>

            <TcAcademyPolicyModal
                isOpen={isTcAcademyPolicyModal}
                onClose={onAcademicHonestyModalClose}
                onConfirm={handlePolicyAccept}
            />

            <DiceModal
                isOpen={isDiceModalOpen}
                onClose={onDiceModalClose}
            />
        </>
    )
}

export default CourseCurriculum
