import { debounce } from 'lodash'
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
import { Params, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import {
    Breadcrumb,
    BreadcrumbItemModel,
    Button,
    LoadingSpinner,
} from '~/libs/ui'
import {
    logError,
    profileContext,
    ProfileContextData,
    UserRole,
} from '~/libs/core'
import { textFormatGetSafeString } from '~/libs/shared'

import {
    CoursesProviderData,
    LearnLesson,
    LearnModule,
    LearnModuleProgress,
    LearnUserCertificationProgress,
    LessonProviderData,
    PageTitle,
    useGetCourses,
    useGetLesson,
    useGetUserCertificationProgress,
    userCertificationProgressAutocompleteCourse,
    UserCertificationProgressProviderData,
    userCertificationProgressStartAsync,
    UserCertificationProgressStatus,
    userCertificationProgressUpdateAsync,
    UserCertificationUpdateProgressActions,
} from '../lib'
import {
    getCertificationCompletedPath,
    getCoursePath,
    getLessonPathFromModule,
} from '../learn.routes'
import { LearnConfig } from '../config'
import { CoursePageContextValue, useCoursePageContext } from '../course-page-wrapper'

import { useCheckAndMarkCourseCompleted } from './hooks/use-mark-course-completed'
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

    const routeParams: Params<string> = useParams()
    const providerParam: string = textFormatGetSafeString(routeParams.provider)

    const [certificationParam, setCourseParam]: [string, Dispatch<SetStateAction<string>>]
        = useState(textFormatGetSafeString(routeParams.certification))
    const [moduleParam, setModuleParam]: [string, Dispatch<SetStateAction<string>>]
        = useState(textFormatGetSafeString(routeParams.module))
    const [lessonParam, setLessonParam]: [string, Dispatch<SetStateAction<string>>]
        = useState(textFormatGetSafeString(routeParams.lesson))
    const [fccFrameReady, setFccFrameReady]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState(false)

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

    const module: string = textFormatGetSafeString(lesson?.module.title)

    const { buildBreadcrumbs, localNavigate }: CoursePageContextValue = useCoursePageContext()

    const breadcrumbs: BreadcrumbItemModel[] = useMemo(() => buildBreadcrumbs([
        {
            name: textFormatGetSafeString(lesson?.course.title),
            url: getCoursePath(providerParam, certificationParam),
        },
        {
            name: module,
            url: getLessonPathFromModule(providerParam, certificationParam, module, lessonParam),
        },
    ]), [
        buildBreadcrumbs,
        certificationParam,
        lesson?.course.title,
        lessonParam,
        module,
        providerParam,
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
        localNavigate(lessonPath)
    }, [
        certificationParam,
        currentModuleData,
        currentStepIndex,
        moduleParam,
        localNavigate,
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
        // mark fcc frame as being ready once we get the first "lesson ready"
        setFccFrameReady(true)

        const [nLessonPath, modulePath, coursePath]: Array<string> = lessonPath.replace(/\/$/, '')
            .split('/')
            .reverse()
        updatePath(nLessonPath, modulePath, coursePath)

        const newLessonId: string = ((): string => {
            if (!courseData) return ''

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const newModule: LearnModule = courseData.modules.find(m => m.dashedName === modulePath)!
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const newLesson: LearnLesson = newModule.lessons.find(l => l.dashedName === nLessonPath)!
            return newLesson.id
        })()

        const currentLesson: { [key: string]: string } = {
            lesson: nLessonPath,
            lessonId: newLessonId,
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleFccLessonComplete: (challengeUuid: string) => void = useCallback(debounce((challengeUuid: string) => {
        let lessonName: string = ''
        let moduleName: string = ''

        // Search in course's meta data, to determine the correct lesson name and module name based on the challengeUuid
        courseData!.modules.forEach(m => {
            const lessonData: LearnLesson | undefined = m.lessons.find(l => l.id === challengeUuid)

            if (!lessonData) {
                return
            }

            lessonName = lessonData.dashedName
            moduleName = m.dashedName
        })

        const currentLesson: { [key: string]: string } = {
            lesson: lessonName,
            module: moduleName,
            uuid: challengeUuid,
        }

        if (!certificateProgress) {
            return
        }

        userCertificationProgressUpdateAsync(
            certificateProgress.id,
            UserCertificationUpdateProgressActions.completeLesson,
            currentLesson,
        )
            .then((progress: LearnUserCertificationProgress) => {
                setCertificateProgress(progress)
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 30), [
        certificateProgress,
        lessonParam,
        moduleParam,
    ])

    /**
     * Handle the navigation away from the last step of the course in the FCC frame
     * @returns
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleFccLastLessonNavigation: () => void = useCallback(debounce(() => {

        if (!certificateProgress) {
            return
        }

        // course is completed, return user to course completed screen
        if (certificateProgress.status === UserCertificationProgressStatus.completed) {
            const completedPath: string = getCertificationCompletedPath(
                providerParam,
                certificationParam,
            )

            localNavigate(completedPath)
            return
        }

        // course is not completed yet,
        // so we find the first incomplete lesson
        // and redirect user to it for a continuous flow
        const firstIncompleteModule: LearnModuleProgress | undefined
            = certificateProgress.moduleProgresses.find(m => m.completedPercentage !== 100)
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

        localNavigate(nextLessonPath)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 30), [
        certificateProgress,
        certificationParam,
        courseData?.modules,
        providerParam,
        localNavigate,
    ])

    useCheckAndMarkCourseCompleted(
        !!profile?.userId,
        providerParam,
        certificateProgress,
        profile?.handle,
        setCertificateProgress,
    )

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

                localNavigate(lessonPath)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        certificationParam,
        courseData,
        courseDataReady,
        lessonParam,
        localNavigate,
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
     * and either is not a wipro user or the wipro user has dice enabled.
     * if not, redirect user to course details page to accept the policy
     */
    useLayoutEffect(() => {

        // if we're not ready, there's nothing to do
        if (!ready) {
            return
        }

        // if the user is logged in,
        // and the user is a either not wipro user or is a wipro user with dice enabled,
        // and if the user has accepted the academic honesty policy,
        // the user is permitted to take the course, so there's nothing to do.
        if (isLoggedIn
            && (!LearnConfig.REQUIRE_DICE_ID || !profile?.isWipro || !!profile?.diceEnabled)
            && !!certificateProgress?.academicHonestyPolicyAcceptedAt) {
            return
        }

        // redirect the user to course details page to perform the
        // necessary actions

        const coursePath: string = getCoursePath(
            providerParam,
            certificationParam,
        )
        localNavigate(coursePath)
    }, [
        ready,
        certificateProgress,
        profile,
        providerParam,
        certificationParam,
        localNavigate,
        isLoggedIn,
    ])

    /**
     * Complete course shortcut for admins
     */
    function adminCompleteCourse(): void {
        // eslint-disable-next-line no-restricted-globals, no-alert
        const confirmed: boolean = confirm('Hey, you\'re about to auto-complete this entire course. Are you sure?')

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
            <PageTitle>
                {`${module}: ${lesson?.title}`}
            </PageTitle>

            <LoadingSpinner hide={ready} />
            <div className={styles.wrapBreadcrumb}>
                <Breadcrumb items={breadcrumbs} />
                {
                    lesson && profile?.roles?.includes(UserRole.tcaAdmin) && (
                        <Button
                            secondary
                            className={styles.completeCourseBtn}
                            size='sm'
                            label='Complete Course'
                            onClick={adminCompleteCourse}
                        />
                    )
                }
            </div>

            {lesson && (
                <div className={styles['main-wrap']}>
                    <FccSidebar
                        certification={certificationParam}
                        courseData={courseData}
                        courseDataReady={courseDataReady}
                        currentStep={`${moduleParam}/${lessonParam}`}
                        certificateProgress={certificateProgress}
                        refetchProgress={refetchProgress}
                        userId={profile?.userId}
                    />

                    <div className={styles['course-frame']}>
                        <TitleNav
                            title={currentModuleData?.name}
                            currentStep={currentStepIndex}
                            maxStep={currentModuleData?.lessons.length ?? 0}
                            onNavigate={handleNavigate}
                        />
                        <hr />

                        <div className={styles['course-iframe']}>
                            <LoadingSpinner className={styles['course-frame-loader']} hide={fccFrameReady} />
                            <FccFrame
                                lesson={lesson}
                                onFccLessonChange={handleFccLessonReady}
                                onFccLessonComplete={handleFccLessonComplete}
                                onFccLastLessonNavigation={handleFccLastLessonNavigation}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default FreeCodeCamp
