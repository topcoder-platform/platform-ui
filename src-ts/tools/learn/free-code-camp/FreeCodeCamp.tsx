import { Dispatch, FC, memo, MutableRefObject, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavigateFunction, useNavigate, useSearchParams } from 'react-router-dom'

import { EnvironmentConfig } from '../../../config'
import {
    Breadcrumb,
    BreadcrumbItemModel,
    LoadingSpinner,
    Portal,
} from '../../../lib'
import {
    CourseOutline,
    CoursesProviderData,
    LearnLesson,
    LearnModule,
    LessonProviderData,
    useCoursesProvider,
    useLessonProvider,
} from '../learn-lib'
import { getFccLessonPath } from '../learn.routes'

import { CollapsiblePane } from './collapsible-pane'
import styles from './FreeCodeCamp.module.scss'
import { TitleNav } from './title-nav'

const FreecodecampIfr: FC<any> = memo((params: any) => (
    <iframe
        className={styles.iframe}
        ref={params.frameRef}
    />
))

const FreeCodeCamp: FC<{}> = () => {
    const navigate: NavigateFunction = useNavigate()
    const [searchParams]: any = useSearchParams()

    const frameRef: MutableRefObject<HTMLElement | any> = useRef()
    const frameIsReady: MutableRefObject<boolean> = useRef<boolean>(false)
    const [courseParam, setCourseParam]: [string, Dispatch<SetStateAction<string>>] = useState(searchParams.get('course') ?? '')
    const [moduleParam, setModuleParam]: [string, Dispatch<SetStateAction<string>>] = useState(searchParams.get('module') ?? '')
    const [lessonParam, setLessonParam]: [string, Dispatch<SetStateAction<string>>] = useState(searchParams.get('lesson') ?? '')

    const {
        course: courseData,
        ready: courseDataReady,
    }: CoursesProviderData = useCoursesProvider(courseParam)

    const { lesson, ready }: LessonProviderData = useLessonProvider(
        courseParam,
        moduleParam,
        lessonParam,
    )

    const breadcrumb: Array<BreadcrumbItemModel> = useMemo(() => [
        { url: '/learn', name: 'Topcoder Academy' },
        { url: `/learn/${lesson?.course.certification}`, name: lesson?.course.title ?? '' },
        { url: '/learn/fcc', name: lesson?.module.title ?? '' },
    ], [lesson])

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

        const lessonPath: string = getFccLessonPath({
            course: courseParam,
            lesson: nextStep.dashedName,
            module: moduleParam,
        })
        navigate(lessonPath)
    }, [currentStepIndex, currentModuleData, courseParam, moduleParam])

    function updatePath(nextPath: string): void {
        const [lessonPath, modulePath, coursePath]: Array<string> = nextPath.replace(/\/$/, '').split('/').reverse()

        if (coursePath !== courseParam) { setCourseParam(coursePath) }
        if (modulePath !== moduleParam) { setModuleParam(modulePath) }
        if (lessonPath !== lessonParam) { setLessonParam(lessonPath) }

        if (lessonPath !== lessonParam || modulePath !== moduleParam || coursePath !== courseParam) {
            window.history.replaceState('', '', `?course=${coursePath}&module=${modulePath}&lesson=${lessonPath}`)
        }
    }

    useEffect(() => {
        if (!frameRef.current || !lesson) {
            return
        }

        if (!frameIsReady.current) {
            Object.assign(frameRef.current, { src: `${EnvironmentConfig.LEARN_SRC}/${lesson.lessonUrl}` })
        } else {
            frameRef.current.contentWindow.postMessage(JSON.stringify({
                data: { path: `/${lesson.lessonUrl}` },
                event: 'fcc:url:update',
            }), '*')
        }
    }, [lesson?.lessonUrl])
    console.debug(EnvironmentConfig)

    useEffect(() => {
        if (!frameRef) {
            return
        }
        const handleEvent: (event: any) => void = (event: any) => {
            const { data: jsonData, origin }: { data: string, origin: string } = event

            if (origin.indexOf(EnvironmentConfig.LEARN_SRC) === -1) {
                return
            }

            const { event: eventName, data }: { data: { path: string }, event: string } = JSON.parse(jsonData)

            if (eventName !== 'fcc:challenge:ready') {
                return
            }

            frameIsReady.current = true
            updatePath(data.path)
        }

        window.addEventListener('message', handleEvent, false)
        return () => {
            window.removeEventListener('message', handleEvent, false)
        }
    }, [frameRef, lessonParam, moduleParam, courseParam])

    useEffect(() => {
        const coursePath: string = searchParams.get('course')
        const modulePath: string = searchParams.get('module')
        const lessonPath: string = searchParams.get('lesson')

        if (coursePath !== courseParam) { setCourseParam(coursePath) }
        if (modulePath !== moduleParam) { setModuleParam(modulePath) }
        if (lessonPath !== lessonParam) { setLessonParam(lessonPath) }
    }, [searchParams])

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
                            <FreecodecampIfr frameRef={frameRef} />
                        </div>
                    </div>
                </Portal>
            )}
        </>
    )
}

export default FreeCodeCamp
