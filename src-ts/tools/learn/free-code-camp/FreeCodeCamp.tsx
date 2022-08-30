import {
    Dispatch,
    FC,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useState,
} from 'react'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'

import {
    Breadcrumb,
    BreadcrumbItemModel,
    LoadingSpinner,
    profileContext,
    ProfileContextData,
} from '../../../lib'
import {
    CollapsiblePane,
    CourseOutline,
    CoursesProviderData,
    LearnLesson,
    LearnModule,
    LearnModuleProgress,
    LessonProviderData,
    useCourses,
    useLearnBreadcrumb,
    useLessonProvider,
    UserCertificationProgressProviderData,
    userCertificationProgressStartAsync,
    UserCertificationProgressStatus,
    userCertificationProgressUpdateAsync,
    UserCertificationUpdateProgressActions,
    useUserCertificationProgress,
} from '../learn-lib'
import { getCertificationCompletedPath, getCoursePath, getLessonPathFromModule } from '../learn.routes'

import { FccFrame } from './fcc-frame'
import styles from './FreeCodeCamp.module.scss'
import { TitleNav } from './title-nav'

const FreeCodeCamp: FC<{}> = () => {

    const {
        initialized: profileReady,
        isLoggedIn,
        profile,
    }: ProfileContextData = useContext(profileContext)

    const navigate: NavigateFunction = useNavigate()
    const routeParams: Params<string> = useParams()
    const providerParam: string = routeParams.provider ?? ''

    const [certificationParam, setCourseParam]: [string, Dispatch<SetStateAction<string>>] = useState(routeParams.certification ?? '')
    const [moduleParam, setModuleParam]: [string, Dispatch<SetStateAction<string>>] = useState(routeParams.module ?? '')
    const [lessonParam, setLessonParam]: [string, Dispatch<SetStateAction<string>>] = useState(routeParams.lesson ?? '')

    const {
        certificationProgress: certificateProgress,
        setCertificateProgress,
        ready: progressReady,
        refetch: refetchProgress,
    }: UserCertificationProgressProviderData = useUserCertificationProgress(
        profile?.userId,
        routeParams.provider,
        certificationParam
    )

    const {
        course: courseData,
        ready: courseDataReady,
    }: CoursesProviderData = useCourses(providerParam, certificationParam)

    const { lesson, ready: lessonReady }: LessonProviderData = useLessonProvider(
        providerParam,
        certificationParam,
        moduleParam,
        lessonParam,
    )

    const ready: boolean = profileReady && courseDataReady && lessonReady && (!isLoggedIn || progressReady)

    const certification: string = lesson?.course.certification ?? ''
    const module: string = lesson?.module.title ?? ''
    const breadcrumb: Array<BreadcrumbItemModel> = useLearnBreadcrumb([
        {
            name: lesson?.course.title ?? '',
            url: getCoursePath(providerParam, certification),
        },
        {
            name: module,
            url: getLessonPathFromModule(providerParam, certification, module, lessonParam),
        },
    ])

    const currentModuleData: LearnModule | undefined = useMemo(() => {
        return courseData?.modules.find(d => d.key === moduleParam)
    }, [courseData, moduleParam])

    const currentStepIndex: number = useMemo(() => {
        if (!currentModuleData) {
            return 0
        }

        const lessonIndex: number = currentModuleData.lessons.findIndex(l => l.dashedName === lessonParam)
        return lessonIndex + 1
    }, [currentModuleData, lessonParam])

    const handleNavigate: (direction: number) => void = useCallback((direction = 1) => {

        const nextStep: LearnLesson | undefined = currentModuleData?.lessons[(currentStepIndex - 1) + direction]
        if (!nextStep) {
            return
        }

        const lessonPath: string = getLessonPathFromModule(
            providerParam,
            certificationParam,
            moduleParam,
            nextStep.dashedName,
        )
        navigate(lessonPath)
    }, [
        certificationParam,
        currentModuleData,
        currentStepIndex,
        moduleParam,
        navigate,
        providerParam,
    ])

    function updatePath(lessonPath: string, modulePath: string, coursePath: string): void {

        if (coursePath !== certificationParam) {
            setCourseParam(coursePath)
        }
        if (modulePath !== moduleParam) {
            setModuleParam(modulePath)
        }
        if (lessonPath !== lessonParam) {
            setLessonParam(lessonPath)
        }

        if (lessonPath !== lessonParam || modulePath !== moduleParam || coursePath !== certificationParam) {
            const nextLessonPath: string = getLessonPathFromModule(
                providerParam,
                coursePath,
                modulePath,
                lessonPath
            )
            window.history.replaceState('', '', nextLessonPath)
        }
    }

    function handleFccLessonReady(lessonPath: string): void {

        const [nLessonPath, modulePath, coursePath]: Array<string> = lessonPath.replace(/\/$/, '').split('/').reverse()
        updatePath(nLessonPath, modulePath, coursePath)

        const currentLesson: { [key: string]: string } = {
            lesson: nLessonPath,
            module: modulePath,
        }

        if (
            !profile?.userId ||
            !lesson?.course.certificationId ||
            !lesson?.course.id
        ) {
            return
        }

        if (!certificateProgress) {
            userCertificationProgressStartAsync(
                profile.userId,
                lesson.course.certificationId,
                lesson.course.id,
                currentLesson
            )
                .then(setCertificateProgress)
        } else {
            // TODO: remove this delay!!
            // TEMP_FIX: delay this api call to allow for previous "completeLesson" call to write in the api
            setTimeout(() => {
                userCertificationProgressUpdateAsync(
                    certificateProgress.id,
                    UserCertificationUpdateProgressActions.currentLesson,
                    currentLesson
                )
                    .then(setCertificateProgress)
            }, 500)
        }
    }

    function handleFccLessonComplete(challengeUuid: string): void {
        const currentLesson: { [key: string]: string } = {
            lesson: lessonParam,
            module: moduleParam,
            uuid: challengeUuid,
        }
        if (certificateProgress) {
            userCertificationProgressUpdateAsync(
                certificateProgress.id,
                UserCertificationUpdateProgressActions.completeLesson,
                currentLesson
            ).then(setCertificateProgress)
        }
    }

    /**
     * Handle the navigation away from the last step of the course in the FCC frame
     * @returns
     */
    function handleFccLastLessonNavigation(): void {
        if (!certificateProgress) {
            return
        }

        // course is completed, return user to course completed screen
        if (certificateProgress.courseProgressPercentage === 100) {
            const completedPath: string = getCertificationCompletedPath(
                providerParam,
                certificationParam
            )

            navigate(completedPath)
            return
        }

        // course is not completed yet,
        // so we find the first incomplete lesson
        // and redirect user to it for a continuous flow
        const firstIncompleteModule: LearnModuleProgress | undefined = certificateProgress.modules.find(m => m.completedPercentage !== 100)
        const moduleLessons: Array<LearnLesson> | undefined = courseData?.modules.find(m => m.key === firstIncompleteModule?.module)?.lessons
        if (!firstIncompleteModule || !moduleLessons) {
            // case unknown, return
            return
        }

        const completedLessons: Array<string> = firstIncompleteModule.completedLessons.map(l => l.dashedName)
        const firstIncompleteLesson: LearnLesson | undefined = moduleLessons.find(l => !completedLessons.includes(l.dashedName))
        if (!firstIncompleteLesson) {
            // case unknown, return
            return
        }

        const nextLessonPath: string = getLessonPathFromModule(
            providerParam,
            certificationParam,
            firstIncompleteModule.module ?? '',
            firstIncompleteLesson.dashedName ?? ''
        )

        navigate(nextLessonPath)
    }

    useEffect(() => {
        if (
            certificateProgress &&
            certificateProgress.courseProgressPercentage === 100 &&
            certificateProgress.status === UserCertificationProgressStatus.inProgress
        ) {
            userCertificationProgressUpdateAsync(
                certificateProgress.id,
                UserCertificationUpdateProgressActions.completeCertificate,
                {}
            )
                .then(setCertificateProgress)
                .then(() => {
                    const completedPath: string = getCertificationCompletedPath(
                        providerParam,
                        certificationParam
                    )

                    navigate(completedPath)
                })
        }
    }, [
        certificateProgress,
        certificationParam,
        navigate,
        providerParam,
        setCertificateProgress,
    ])

    useEffect(() => {
        const certificationPath: string = routeParams.certification ?? ''
        const modulePath: string = routeParams.module ?? ''
        const lessonPath: string = routeParams.lesson ?? ''

        if (certificationPath !== certificationParam) {
            setCourseParam(certificationPath)
        }
        if (modulePath !== moduleParam) {
            setModuleParam(modulePath)
        }
        if (lessonPath !== lessonParam) {
            setLessonParam(lessonPath)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        // DO NOT UPDATE THIS DEPS ARRAY!!
        // we do not care about changes to the other deps
        // !!only routeParams needs to trigger this effect!!
        routeParams,
    ])

    /**
     * Check if the user accepted the academic honesty policy
     * if not, redirect user to course details page to accept the policy
     */
    useLayoutEffect(() => {
        if (ready && !(isLoggedIn && certificateProgress?.academicHonestyPolicyAcceptedAt)) {
            const coursePath: string = getCoursePath(
                providerParam,
                certificationParam
            )
            navigate(coursePath)
        }
    }, [
        ready,
        certificateProgress,
        providerParam,
        certificationParam,
        navigate,
        isLoggedIn,
    ])

    return (
        <>
            <LoadingSpinner hide={ready} />
            <Breadcrumb items={breadcrumb} />

            {lesson && (
                <div className={styles['main-wrap']}>
                    <div className={styles['course-outline-pane']}>
                        <CollapsiblePane
                            title='Course Outline'
                            onToggle={(isOpen) => isOpen && refetchProgress()}
                        >
                            <div className={styles['course-outline-wrap']}>
                                <div className={styles['course-outline-title']}>
                                    {courseData?.title}
                                </div>
                                <CourseOutline
                                    course={courseData}
                                    ready={courseDataReady}
                                    currentStep={`${moduleParam}/${lessonParam}`}
                                    progress={certificateProgress}
                                />
                            </div>
                        </CollapsiblePane>
                    </div>

                    <div className={styles['course-frame']}>
                        <TitleNav
                            title={currentModuleData?.meta.name}
                            currentStep={currentStepIndex}
                            maxStep={currentModuleData?.lessons.length ?? 0}
                            onNavigate={handleNavigate}
                        />
                        <hr />
                        <FccFrame
                            lesson={lesson}
                            onFccLessonChange={handleFccLessonReady}
                            onFccLessonComplete={handleFccLessonComplete}
                            onFccLastLessonNavigation={handleFccLastLessonNavigation}
                        />
                    </div>
                </div>
            )}
        </>
    )
}

export default FreeCodeCamp
