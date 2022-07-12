import { Dispatch, FC, SetStateAction, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { NavigateFunction, Params, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import {
    Breadcrumb,
    BreadcrumbItemModel,
    LoadingSpinner,
    Portal,
    profileContext,
    ProfileContextData,
} from '../../../lib'
import {
    CollapsiblePane,
    CourseOutline,
    CoursesProviderData,
    LearnLesson,
    LearnModule,
    LessonProviderData,
    MyCertificationProgressProviderData,
    MyCertificationProgressStatus,
    startMyCertificationsProgressAsync,
    UpdateMyCertificateProgressActions,
    updateMyCertificationsProgressAsync,
    useCoursesProvider,
    useLessonProvider,
    useMyCertificationProgress,
} from '../learn-lib'
import { getCoursePath, getFccLessonPath } from '../learn.routes'

import { FccFrame } from './fcc-frame'
import styles from './FreeCodeCamp.module.scss'
import { TitleNav } from './title-nav'

const FreeCodeCamp: FC<{}> = () => {
    const { profile }: ProfileContextData = useContext(profileContext)

    const navigate: NavigateFunction = useNavigate()
    const routeParams: Params<string> = useParams()

    const providerParam: string = routeParams.provider ?? ''
    const [certificationParam, setCourseParam]: [string, Dispatch<SetStateAction<string>>] = useState(routeParams.certification ?? '')
    const [moduleParam, setModuleParam]: [string, Dispatch<SetStateAction<string>>] = useState(routeParams.module ?? '')
    const [lessonParam, setLessonParam]: [string, Dispatch<SetStateAction<string>>] = useState(routeParams.lesson ?? '')

    const {
        certificateProgress,
        setCertificateProgress,
        ready: progressReady
    }: MyCertificationProgressProviderData = useMyCertificationProgress(profile?.userId, routeParams.provider, certificationParam)

    const {
        course: courseData,
        ready: courseDataReady,
    }: CoursesProviderData = useCoursesProvider(providerParam, certificationParam)

    const { lesson, ready: lessonReady }: LessonProviderData = useLessonProvider(
        providerParam,
        certificationParam,
        moduleParam,
        lessonParam,
    )

    const ready: boolean = courseDataReady && lessonReady && progressReady

    const breadcrumb: Array<BreadcrumbItemModel> = useMemo(() => [
        { url: '/learn', name: 'Topcoder Academy' },
        { url: `/learn/${providerParam}/${lesson?.course.certification}`, name: lesson?.course.title ?? '' },
        { url: '/learn/fcc', name: lesson?.module.title ?? '' },
    ], [providerParam, lesson])

    const currentModuleData: LearnModule|undefined = useMemo(() => {
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

        const nextStep: LearnLesson|undefined = currentModuleData?.lessons[(currentStepIndex - 1) + direction]
        if (!nextStep) {
            return
        }

        const lessonPath: string = getFccLessonPath(
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
        if (coursePath !== certificationParam) { setCourseParam(coursePath) }
        if (modulePath !== moduleParam) { setModuleParam(modulePath) }
        if (lessonPath !== lessonParam) { setLessonParam(lessonPath) }

        if (lessonPath !== lessonParam || modulePath !== moduleParam || coursePath !== certificationParam) {
            const nextLessonPath: string = getFccLessonPath(
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

        const currentLesson: {[key: string]: string} = {
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
            startMyCertificationsProgressAsync(
                profile.userId,
                lesson.course.certificationId,
                lesson.course.id,
                currentLesson
            ).then(setCertificateProgress)
        } else {
            // TODO: remove this delay!!
            // TEMP_FIX: delay this api call to allow for previous "completeLesson" call to write in the api
            setTimeout(() => {
                updateMyCertificationsProgressAsync(
                        certificateProgress.id,
                        UpdateMyCertificateProgressActions.currentLesson,
                        currentLesson
                    )
                    .then(setCertificateProgress)
            }, 500)
        }
    }

    function handleFccLessonComplete(): void {
        const currentLesson: {[key: string]: string} = {
            lesson: lessonParam,
            module: moduleParam,
        }
        if (certificateProgress) {
            updateMyCertificationsProgressAsync(
                certificateProgress.id,
                UpdateMyCertificateProgressActions.completeLesson,
                currentLesson
            ).then(setCertificateProgress)
        }
    }

    useEffect(() => {
      if (
        certificateProgress &&
        certificateProgress.courseProgressPercentage === 100 &&
        certificateProgress.status === MyCertificationProgressStatus.inProgress
    ) {
        updateMyCertificationsProgressAsync(
            certificateProgress.id,
            UpdateMyCertificateProgressActions.completeCertificate,
            {}
        ).then(setCertificateProgress)
      }
    }, [certificateProgress, setCertificateProgress])

    useEffect(() => {
        const certificationPath: string = routeParams.certification ?? ''
        const modulePath: string = routeParams.module ?? ''
        const lessonPath: string = routeParams.lesson ?? ''

        if (certificationPath !== certificationParam) { setCourseParam(certificationPath) }
        if (modulePath !== moduleParam) { setModuleParam(modulePath) }
        if (lessonPath !== lessonParam) { setLessonParam(lessonPath) }
    }, [routeParams])

    /**
     * Check if the user accepted the academic honesty policy
     * if not, redirect user to course details page to accept the policy
     */
    useLayoutEffect(() => {
        if (ready && !certificateProgress?.academicHonestyPolicyAcceptedAt) {
            const coursePath: string = getCoursePath(
                providerParam,
                certificationParam
            )
            navigate(coursePath)
        }
    }, [ready, certificateProgress, providerParam, certificationParam, navigate])

    return (
        <>
            {!ready && <LoadingSpinner />}
            <Breadcrumb items={breadcrumb} />

            {lesson && (
                <Portal portalId='page-subheader-portal-el'>
                    <div className={styles['main-wrap']}>
                        <div className={styles['course-outline-pane']}>
                            <CollapsiblePane title='Course Outline'>
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
                            />
                        </div>
                    </div>
                </Portal>
            )}
        </>
    )
}

export default FreeCodeCamp
