/* eslint-disable react/no-danger */
import { FC, ReactNode, useContext } from 'react'
import { Params, useParams } from 'react-router-dom'

import {
    Breadcrumb,
    BreadcrumbItemModel,
    ContentLayout,
    IconOutline,
    LoadingSpinner,
    profileContext,
    ProfileContextData,
    textFormatGetSafeString,
} from '../../../lib'
import {
    AllCertificationsProviderData,
    CoursesProviderData,
    CourseTitle,
    ResourceProviderData,
    useGetCertification,
    useGetCourses,
    useGetResourceProvider,
    useGetUserCertificationProgress,
    useLearnBreadcrumb,
    UserCertificationProgressProviderData,
    UserCertificationProgressStatus,
} from '../learn-lib'
import { getCoursePath } from '../learn.routes'

import { CourseCurriculum } from './course-curriculum'
import { PromoCourse } from './promo-course'
import styles from './CourseDetailsPage.module.scss'

const CourseDetailsPage: FC<{}> = () => {

    const routeParams: Params<string> = useParams()
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)

    const {
        provider: resourceProvider,
    }: ResourceProviderData = useGetResourceProvider(routeParams.provider)

    const {
        course,
        ready: courseReady,
    }: CoursesProviderData = useGetCourses(textFormatGetSafeString(routeParams.provider), routeParams.certification)

    const {
        certificationProgress: progress,
        ready: progressReady,
        setCertificateProgress,
    }: UserCertificationProgressProviderData = useGetUserCertificationProgress(
        profile?.userId,
        routeParams.provider,
        routeParams.certification,
    )

    const {
        certification: certificate,
        ready: certificateReady,
    }: AllCertificationsProviderData = useGetCertification(
        routeParams.provider,
        textFormatGetSafeString(course?.certificationId),
        {
            enabled: courseReady && !!course?.certificationId,
        },
    )

    const ready: boolean = profileReady && courseReady && certificateReady && (!profile || progressReady)

    const breadcrumb: Array<BreadcrumbItemModel> = useLearnBreadcrumb([
        {

            name: textFormatGetSafeString(course?.title),
            url: getCoursePath(routeParams.provider as string, textFormatGetSafeString(routeParams.certification)),
        },
    ])

    function getDescription(): ReactNode {

        if (!course) {
            return undefined
        }

        return progress?.status === UserCertificationProgressStatus.completed
            ? (
                <>
                    <h3 className='details'>Suggested next steps</h3>

                    <div className={styles.text}>
                        <p>
                            Now that you have completed the
                            {' '}
                            {course.title}
                            ,
                            we&appos;d recommend you enroll in another course to continue your learning.
                            You can view our other courses from the Topcoder Academy course page.
                        </p>
                    </div>
                </>
            )
            : (
                course.keyPoints && (
                    <>
                        <h3 className='details'>Why should you complete this course?</h3>

                        <div
                            className={styles.text}
                            dangerouslySetInnerHTML={{ __html: (course.keyPoints ?? []).join('<br /><br />') }}
                        />
                    </>
                )
            )
    }

    function getPrerequisites(): ReactNode {

        if (!course) {
            return undefined
        }

        return progress?.status === UserCertificationProgressStatus.completed ? (
            <></>
        ) : (
            <>
                <h3 className='details mtop'>Prerequisites</h3>

                <div className={styles.text}>
                    There are no prerequisites for this course.
                    The course content is appropriate for new learners with no previous experience in this topic.
                </div>
            </>
        )
    }

    function getCompletionSuggestion(): ReactNode {

        if (!course) {
            return undefined
        }

        return progress?.status === UserCertificationProgressStatus.completed ? (
            <></>
        ) : (
            !!course.completionSuggestions?.length && (
                <>
                    <h3 className='details mtop'>Suggestions for completing this course</h3>

                    <div
                        className={styles.text}
                        dangerouslySetInnerHTML={{ __html: (course.completionSuggestions ?? []).join('<br /><br />') }}
                    />
                </>
            )
        )
    }

    function getFooter(): ReactNode {

        if (!resourceProvider) {
            return undefined
        }

        return (
            <div className={styles['credits-link']}>
                <a href={`//${resourceProvider.url}`} target='_blank' referrerPolicy='no-referrer' rel='noreferrer'>
                    This course was created by the
                    {' '}
                    {resourceProvider.url}
                    {' '}
                    community.
                    <IconOutline.ExternalLinkIcon />
                </a>
            </div>
        )
    }

    return (
        <ContentLayout>
            {!ready && (
                <div className={styles.wrap}>
                    <LoadingSpinner />
                </div>
            )}
            <Breadcrumb items={breadcrumb} />
            {ready && course && (
                <>
                    <div className={styles.wrap}>
                        <div className={styles['intro-copy']}>
                            <CourseTitle
                                size='lg'
                                title={course.title}
                                credits={course.resourceProvider.name}
                                trackType={certificate?.trackType}
                            />

                            <div
                                className={styles.text}
                                dangerouslySetInnerHTML={{ __html: course.introCopy.join('<br /><br />') }}
                            />
                        </div>

                        <div className={styles.description}>
                            {getDescription()}
                            {getPrerequisites()}
                            {getCompletionSuggestion()}
                            <div className={styles['coming-soon']}>
                                <PromoCourse />
                            </div>
                        </div>

                        <div className={styles.aside}>
                            <CourseCurriculum
                                course={course}
                                progress={progress}
                                progressReady={progressReady}
                                profile={profile}
                                setCertificateProgress={setCertificateProgress}
                            />
                        </div>
                    </div>
                    {getFooter()}
                </>
            )}
        </ContentLayout>
    )
}

export default CourseDetailsPage
