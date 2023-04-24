/* eslint-disable react/no-danger */
import { FC, ReactNode, useContext, useMemo } from 'react'
import { Params, useLocation, useParams } from 'react-router-dom'

import {
    Breadcrumb,
    BreadcrumbItemModel,
    ContentLayout,
    IconOutline,
    LoadingSpinner,
} from '~/libs/ui'
import { textFormatGetSafeString } from '~/libs/shared'
import { profileContext, ProfileContextData } from '~/libs/core'

import {
    AllCertificationsProviderData,
    CoursesProviderData,
    CourseTitle,
    PageTitle,
    ResourceProviderData,
    TCACertificationProgressBox,
    useGetCertification,
    useGetCourses,
    useGetResourceProvider,
    useGetUserCertificationProgress,
    useLearnBreadcrumb,
    UserCertificationProgressProviderData,
    UserCertificationProgressStatus,
} from '../lib'
import { getCoursePath, getTCACertificationPath } from '../learn.routes'

import { CourseCurriculum } from './course-curriculum'
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
        certification: certificate,
        ready: certificateReady,
    }: AllCertificationsProviderData = useGetCertification(
        routeParams.provider,
        textFormatGetSafeString(course?.certificationId),
        {
            enabled: courseReady && !!course?.certificationId,
        },
    )

    const {
        certificationProgress: progress,
        ready: progressReady,
        setCertificateProgress,
    }: UserCertificationProgressProviderData = useGetUserCertificationProgress(
        profile?.userId,
        routeParams.provider,
        certificate?.certification,
    )

    const ready: boolean = profileReady && courseReady && certificateReady && (!profile || progressReady)

    const location: any = useLocation()

    const breadcrumbItems: BreadcrumbItemModel[] = useMemo(() => {
        const bItems: BreadcrumbItemModel[] = [
            {

                name: textFormatGetSafeString(course?.title),
                url: getCoursePath(routeParams.provider as string, textFormatGetSafeString(routeParams.certification)),
            },
        ]

        // if coming path is from TCA certification details page
        // then we need to add the certification to the navi list
        if (location.state?.tcaCertInfo) {
            bItems.unshift({
                name: location.state.tcaCertInfo.title,
                url: getTCACertificationPath(location.state.tcaCertInfo.dashedName),
            })
        }

        return bItems
    }, [
        course?.title,
        routeParams.certification,
        routeParams.provider,
        location.state,
    ])

    const breadcrumb: Array<BreadcrumbItemModel> = useLearnBreadcrumb(breadcrumbItems)

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
                            we&apos;d recommend you enroll in another course to continue your learning.
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

    function getProviderCredits(): ReactNode {

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
            <PageTitle>{course?.title ?? 'Course Details'}</PageTitle>

            {!ready && (
                <div className={styles.wrap}>
                    <LoadingSpinner />
                </div>
            )}
            <Breadcrumb items={breadcrumb} />
            {ready && course && certificate && (
                <>
                    <div className={styles.wrap}>
                        <div className={styles['intro-copy']}>
                            <CourseTitle
                                size='lg'
                                title={course.title}
                                provider={course.resourceProvider.name}
                                trackType={certificate?.certificationCategory.track}
                            />

                            <TCACertificationProgressBox
                                userId={profile?.userId}
                                className={styles.tcaCertBanner}
                                fccCertificateId={certificate.id}
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
                            {getProviderCredits()}
                        </div>

                        <div className={styles.aside}>
                            <CourseCurriculum
                                certification={routeParams.certification ?? ''}
                                course={course}
                                progress={progress}
                                progressReady={progressReady}
                                profile={profile}
                                setCertificateProgress={setCertificateProgress}
                            />
                        </div>
                    </div>
                </>
            )}
        </ContentLayout>
    )
}

export default CourseDetailsPage
