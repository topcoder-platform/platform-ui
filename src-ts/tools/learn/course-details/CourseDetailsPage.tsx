import { FC, useContext, useMemo } from 'react'
import { Params, useParams } from 'react-router-dom'

import {
    Breadcrumb,
    BreadcrumbItemModel,
    ContentLayout,
    IconOutline,
    LoadingSpinner,
    profileContext,
    ProfileContextData,
} from '../../../lib'
import {
    CoursesProviderData,
    CourseTitle,
    MyCertificationProgressProviderData,
    useCoursesProvider,
    useMyCertificationProgress
} from '../learn-lib'

import { CourseCurriculum } from './course-curriculum'
import styles from './CourseDetailsPage.module.scss'
import { PromoCourse } from './promo-course'

interface CourseDetailsPageProps {
}

const CourseDetailsPage: FC<CourseDetailsPageProps> = (props: CourseDetailsPageProps) => {
    const routeParams: Params<string> = useParams()
    const { profile }: ProfileContextData = useContext(profileContext)

    const {
        course,
        ready,
    }: CoursesProviderData = useCoursesProvider(routeParams.provider ?? '', routeParams.certification)

    const { certificateProgress: progress }: MyCertificationProgressProviderData = useMyCertificationProgress(profile?.userId, routeParams.provider, routeParams.certification)

    const breadcrumb: Array<BreadcrumbItemModel> = useMemo(() => [
        { url: '/learn', name: 'Topcoder Academy' },
        { url: `/learn/${routeParams.provider}/${routeParams.certification}`, name: course?.title ?? '' },
    ], [routeParams, course])

    return (
        <ContentLayout>
            {!ready && (
                <div className={styles['wrap']}>
                    <LoadingSpinner />
                </div>
            )}
            <Breadcrumb items={breadcrumb} />
            {ready && course && (
                <>
                    <div className={styles['wrap']}>
                        <div className={styles['main']}>
                            <div className={styles['description']}>
                                <CourseTitle size='lg' title={course.title} credits={course?.provider} type='webdev' />

                                <div
                                    className={styles['text']}
                                    dangerouslySetInnerHTML={{ __html: course.introCopy.join('<br /><br />') }}
                                ></div>

                                {progress?.status === 'completed' ? (
                                    <>
                                        <h3 className='details'>Suggested next steps</h3>

                                        <div className={styles['text']}>
                                            <p>
                                                Now that you have completed the {course.title},
                                                we'd recommend you enroll in another course to continue your learning.
                                                You can view our other courses from the Topcoder Academy course page.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    course.keyPoints && (
                                        <>
                                            <h3 className='details'>Why should you complete this course?</h3>

                                            <div
                                                className={styles['text']}
                                                dangerouslySetInnerHTML={{ __html: (course.keyPoints ?? []).join('<br /><br />') }}
                                            ></div>
                                        </>
                                    )
                                )}
                            </div>

                            <div className={styles['coming-soon']}>
                                <PromoCourse />
                            </div>
                        </div>
                        <div className={styles['aside']}>
                            <CourseCurriculum course={course} progress={progress} />
                        </div>
                    </div>
                    {course?.provider === 'freeCodeCamp' && (
                        <div className={styles['credits-link']}>
                            <a href='https://freecodecamp.org/' target='_blank' referrerPolicy='no-referrer'>
                                This course was created by the freeCodeCamp.org community.
                                <IconOutline.ExternalLinkIcon />
                            </a>
                        </div>
                    )}
                </>
            )}
        </ContentLayout>
    )
}

export default CourseDetailsPage
