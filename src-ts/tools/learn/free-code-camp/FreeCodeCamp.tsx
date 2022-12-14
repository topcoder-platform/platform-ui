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
import { toast, ToastContent } from 'react-toastify'

import {
    Breadcrumb,
    BreadcrumbItemModel,
    Button,
    LoadingSpinner,
    logError,
    profileContext,
    ProfileContextData,
    surveyTriggerForUser,
    textFormatGetSafeString,
    UserRole,
} from '../../../lib'
import {
    CoursesProviderData,
    LearnLesson,
    LearnModule,
    LearnModuleProgress,
    LearnModuleStatus,
    LearnUserCertificationProgress,
    LessonProviderData,
    useGetCourses,
    useGetLesson,
    useGetUserCertificationProgress,
    useLearnBreadcrumb,
    userCertificationProgressAutocompleteCourse,
    userCertificationProgressCompleteCourseAsync,
    UserCertificationProgressProviderData,
    userCertificationProgressStartAsync,
    UserCertificationProgressStatus,
    userCertificationProgressUpdateAsync,
    UserCertificationUpdateProgressActions,
} from '../learn-lib'
import { getCertificationCompletedPath, getCoursePath, getLessonPathFromModule } from '../learn.routes'

import { FccFrame } from './fcc-frame'
import { FccSidebar } from './fcc-sidebar'
import { TitleNav } from './title-nav'
import styles from './FreeCodeCamp.module.scss'

const FreeCodeCamp: FC<{}> = () => {

    const {
        initialized: profileReady,
        isLoggedIn,
        profile,
    }: ProfileContextData = useContext(profileContext)

    const navigate: NavigateFunction = useNavigate()
    const routeParams: Params<string> = useParams()
    const providerParam: string = textFormatGetSafeString(routeParams.provider)

    const [certificationParam, setCourseParam]: [string, Dispatch<SetStateAction<string>>]
        = useState(textFormatGetSafeString(routeParams.certification))
    const [moduleParam, setModuleParam]: [string, Dispatch<SetStateAction<string>>]
        = useState(textFormatGetSafeString(routeParams.module))
    const [lessonParam, setLessonParam]: [string, Dispatch<SetStateAction<string>>]
        = useState(textFormatGetSafeString(routeParams.lesson))

    const {
        certificationProgress: certificateProgress,
        setCertificateProgress,
        ready: progressReady,
        refetch: refetchProgress,
    }: UserCertificationProgressProviderData = useGetUserCertificationProgress(
        profile?.userId,
        routeParams.provider,
        certificationParam,
    )

    const {
        course: courseData,
        ready: courseDataReady,
    }: CoursesProviderData = useGetCourses(providerParam, certificationParam)

    const { lesson, ready: lessonReady }: LessonProviderData = useGetLesson(
        providerParam,
        certificationParam,
        moduleParam,
        lessonParam,
    )

    const ready: boolean = profileReady && courseDataReady && lessonReady && (!isLoggedIn || progressReady)

    const certification: string = textFormatGetSafeString(lesson?.course.certification)
    const module: string = textFormatGetSafeString(lesson?.module.title)
    const breadcrumb: Array<BreadcrumbItemModel> = useLearnBreadcrumb([
        {
            name: textFormatGetSafeString(lesson?.course.title),
            url: getCoursePath(providerParam, certification),
        },
        {
            name: module,
            url: getLessonPathFromModule(providerParam, certification, module, lessonParam),
        },
    ])

    const currentModuleData: LearnModule | undefined
        = useMemo(() => courseData?.modules.find(d => d.key === moduleParam), [courseData, moduleParam])

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
                lessonPath,
            )
            window.history.replaceState('', '', nextLessonPath)
        }
    }

    const handleFccLessonReady: (lessonPath: string) => void = useCallback((lessonPath: string) => {

        const [nLessonPath, modulePath, coursePath]: Array<string> = lessonPath.replace(/\/$/, '')
            .split('/')
            .reverse()
        updatePath(nLessonPath, modulePath, coursePath)

        const currentLesson: { [key: string]: string } = {
            lesson: nLessonPath,
            module: modulePath,
        }

        if (
            !profile?.userId
            || !lesson?.course.certificationId
            || !lesson?.course.id
        ) {
            return
        }

        if (!certificateProgress) {
            userCertificationProgressStartAsync(
                profile.userId,
                lesson.course.certificationId,
                lesson.course.id,
                currentLesson,
            )
                .then(setCertificateProgress)
        } else {
            // TODO: remove this delay!!
            // TEMP_FIX: delay this api call to allow for previous "completeLesson" call to write in the api
            setTimeout(() => {
                userCertificationProgressUpdateAsync(
                    certificateProgress.id,
                    UserCertificationUpdateProgressActions.currentLesson,
                    currentLesson,
                )
                    .then(setCertificateProgress)
            }, 500)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        certificateProgress,
        lesson?.course.certificationId,
        lesson?.course.id,
        profile?.userId,
    ])

    const handleFccLessonComplete: (challengeUuid: string) => void = useCallback((challengeUuid: string) => {

        const currentLesson: { [key: string]: string } = {
            lesson: lessonParam,
            module: moduleParam,
            uuid: challengeUuid,
        }

        if (!certificateProgress) {
            return
        }

        // get the current module as it exists before it's completed
        const currentModule: LearnModuleProgress | undefined = getModuleFromProgress(certificateProgress)
        const certWasInProgress: boolean = currentModule?.moduleStatus !== LearnModuleStatus.completed

        userCertificationProgressUpdateAsync(
            certificateProgress.id,
            UserCertificationUpdateProgressActions.completeLesson,
            currentLesson,
        )
            .then((progress: LearnUserCertificationProgress) => {

                setCertificateProgress(progress)
                handleSurvey(certWasInProgress, progress)

            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        certificateProgress,
        lessonParam,
        moduleParam,
    ])

    function getModuleFromProgress(certProgress: LearnUserCertificationProgress):
        LearnModuleProgress | undefined {

        return certProgress.modules.find(m => m.module === moduleParam)
    }

    function handleSurvey(certWasInProgress: boolean, progress: LearnUserCertificationProgress): void {

        // if the current module wasn't in progress, there's nothing to do
        if (!certWasInProgress) {
            return
        }

        // if the updated module isn't completed now, there's nothing to do
        const moduleResult: LearnModuleProgress | undefined = getModuleFromProgress(progress)
        if (moduleResult?.moduleStatus !== LearnModuleStatus.completed) {
            return
        }

        // if there are any other modules that have been completed, there's nothing to do
        if (progress.modules
            .some(m => m.module !== moduleParam && m.moduleStatus === LearnModuleStatus.completed)
        ) {
            return
        }

        // this is the last lesson to be completed in the first module completed,
        // so it's good to show the trigger
        surveyTriggerForUser('TCA First Module Completed', profile?.userId)
    }

    /**
     * Handle the navigation away from the last step of the course in the FCC frame
     * @returns
     */
    const handleFccLastLessonNavigation: () => void = useCallback(() => {

        if (!certificateProgress) {
            return
        }

        // course is completed, return user to course completed screen
        if (certificateProgress.courseProgressPercentage === 100) {
            const completedPath: string = getCertificationCompletedPath(
                providerParam,
                certificationParam,
            )

            navigate(completedPath)
            return
        }

        // course is not completed yet,
        // so we find the first incomplete lesson
        // and redirect user to it for a continuous flow
        const firstIncompleteModule: LearnModuleProgress | undefined
            = certificateProgress.modules.find(m => m.completedPercentage !== 100)
        const moduleLessons: Array<LearnLesson> | undefined
            = courseData?.modules.find(m => m.key === firstIncompleteModule?.module)?.lessons
        if (!firstIncompleteModule || !moduleLessons) {
            // case unknown, return
            return
        }

        const completedLessons: Array<string> = firstIncompleteModule.completedLessons.map(l => l.dashedName)
        const firstIncompleteLesson: LearnLesson | undefined
            = moduleLessons.find(l => !completedLessons.includes(l.dashedName))
        if (!firstIncompleteLesson) {
            // case unknown, return
            return
        }

        const nextLessonPath: string = getLessonPathFromModule(
            providerParam,
            certificationParam,
            firstIncompleteModule.module ?? '',
            firstIncompleteLesson.dashedName ?? '',
        )

        navigate(nextLessonPath)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        certificateProgress,
        certificationParam,
        courseData?.modules,
        providerParam,
    ])

    useEffect(() => {

        // if we don't yet have the user's handle,
        // or if the cert isn't complete,
        // or the cert isn't in progress,
        // there's nothing to do
        if (
            !profile?.handle
            || certificateProgress?.certificationProgressPercentage !== 100
            || certificateProgress?.status !== UserCertificationProgressStatus.inProgress
        ) {
            return
        }

        // it's safe to complete the course
        userCertificationProgressCompleteCourseAsync(
            certificateProgress.id,
            certificationParam,
            profile.handle,
            providerParam,
        )
            .then(setCertificateProgress)
            .then(() => {
                const completedPath: string = getCertificationCompletedPath(
                    providerParam,
                    certificationParam,
                )
                navigate(completedPath)
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        certificateProgress,
        certificationParam,
        profile?.handle,
        profile?.userId,
        providerParam,
    ])

    useEffect(() => {
        if (courseDataReady && courseData) {
            const moduleParamData: LearnModule = courseData.modules.find(m => m.key === moduleParam)
                ?? courseData.modules[0]
            const lessonParamExists: boolean = !!moduleParamData?.lessons.find(l => l.dashedName === lessonParam)

            if (!lessonParamExists) {
                const lessonPath: string = getLessonPathFromModule(
                    providerParam,
                    certificationParam,
                    moduleParamData.key,
                    moduleParamData.lessons[0].dashedName,
                )

                navigate(lessonPath)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        certificationParam,
        courseData,
        courseDataReady,
        lessonParam,
        moduleParam,
        providerParam,
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
                certificationParam,
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

    /**
     * Complete course shortcut for admins
     */
    function adminCompleteCourse(): void {
        const confirmed = confirm('Hey, you\'re about to auto-complete this entire course. Are you sure?');

        if (!certificateProgress?.id || !confirmed) {
            return
        }

        userCertificationProgressAutocompleteCourse(certificateProgress.id)
            .then(setCertificateProgress)
            .then(() => {
                toast.info(<p>Yay, success! You completed the course.</p>)
            })
            .catch(error => {
                logError(error)
                toast.error('Oops! We couldn\'t complete your request as some error happened. See console for more...')
            })
    }

    return (
        <>
            <LoadingSpinner hide={ready} />
            <div className={styles.wrapBreadcrumb}>
                <Breadcrumb items={breadcrumb} />
                {
                    lesson && profile?.roles?.includes(UserRole.tcaAdmin) && (
                        <Button
                            buttonStyle={'secondary'}
                            className={styles.completeCourseBtn}
                            size={'xs'}
                            label='Complete Course'
                            onClick={adminCompleteCourse}
                        />
                    )
                }
            </div>

            {lesson && (
                <div className={styles['main-wrap']}>
                    <FccSidebar
                        courseData={courseData}
                        courseDataReady={courseDataReady}
                        currentStep={`${moduleParam}/${lessonParam}`}
                        certificateProgress={certificateProgress}
                        refetchProgress={refetchProgress}
                    />

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
