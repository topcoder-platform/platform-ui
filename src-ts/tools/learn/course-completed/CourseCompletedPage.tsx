import { FC, useContext, useEffect, useMemo } from 'react'
import { Params, useParams } from 'react-router-dom'

import {
    Breadcrumb,
    BreadcrumbItemModel,
    LoadingSpinner,
    profileContext,
    ProfileContextData,
    textFormatGetSafeString,
} from '../../../lib'
import {
    AllCertificationsProviderData,
    CoursesProviderData,
    PageTitle,
    TCACertificationCheckCompleted,
    TCACertificationProviderData,
    useGetCertification,
    useGetCourses,
    useGetTCACertification,
    useGetUserCertificationProgress,
    UserCertificationProgressProviderData,
    UserCertificationProgressStatus,
    useTCACertificationCheckCompleted,
} from '../learn-lib'
import { getCoursePath, LEARN_PATHS } from '../learn.routes'
import { CoursePageContextValue, useCoursePageContext } from '../course-page-wrapper'

import { CourseView } from './course-view'
import { TCACertificationView } from './tca-certification-view'
import styles from './CourseCompletedPage.module.scss'

const CourseCompletedPage: FC<{}> = () => {

    const { buildBreadcrumbs, localNavigate }: CoursePageContextValue = useCoursePageContext()
    const routeParams: Params<string> = useParams()
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)
    const providerParam: string = textFormatGetSafeString(routeParams.provider)
    const certificationParam: string = textFormatGetSafeString(routeParams.certification)
    const coursePath: string = getCoursePath(providerParam, certificationParam)

    const {
        course: courseData,
        ready: courseDataReady,
    }: CoursesProviderData = useGetCourses(providerParam, certificationParam)

    const {
        certificationProgress: progress,
        ready: progressReady,
    }: UserCertificationProgressProviderData = useGetUserCertificationProgress(
        profile?.userId,
        routeParams.provider,
        routeParams.certification,
    )

    const {
        certification,
        ready: certifReady,
    }: AllCertificationsProviderData = useGetCertification(
        providerParam,
        textFormatGetSafeString(progress?.fccCertificationId),
        {
            enabled: progressReady && !!progress?.fccCertificationId,
        },
    )

    const { certification: tcaCertificationName, ready: tcaCertifCompletedCheckReady }: TCACertificationCheckCompleted
        = useTCACertificationCheckCompleted(
            'FccCertificationProgress',
            progress?.id ?? '',
            { enabled: !!progress?.id },
        )

    const { certification: tcaCertification }: TCACertificationProviderData = useGetTCACertification(
        tcaCertificationName ?? '',
        { enabled: !!tcaCertificationName },
    )

    const ready: boolean = useMemo(() => {
        const isLoggedIn: boolean = profileReady && !!profile
        const certificatesDataReady: boolean = progressReady && certifReady
        const tcaCertReady: boolean = progressReady && (!progress?.id || !!tcaCertifCompletedCheckReady)

        return profileReady && courseDataReady && (
            !isLoggedIn || (certificatesDataReady && tcaCertReady)
        )
    }, [
        certifReady,
        courseDataReady,
        profile,
        profileReady,
        progress?.id,
        progressReady,
        tcaCertifCompletedCheckReady,
    ])

    const breadcrumbs: Array<BreadcrumbItemModel> = useMemo(() => buildBreadcrumbs([
        {
            name: courseData?.title ?? '',
            url: coursePath,
        },
        {
            name: 'Congratulations!',
            url: LEARN_PATHS.completed,
        },
    ]), [buildBreadcrumbs, courseData?.title, coursePath])

    useEffect(() => {
        if (ready && progress?.status !== UserCertificationProgressStatus.completed) {
            localNavigate(coursePath)
        }
    }, [
        coursePath,
        localNavigate,
        progress,
        ready,
    ])

    return (
        <>
            <PageTitle>
                {`${courseData?.title ?? 'Course'} Completed`}
            </PageTitle>

            <LoadingSpinner hide={ready} />

            {ready && courseData && (
                <>
                    <Breadcrumb items={breadcrumbs} />
                    <div className={styles['main-wrap']}>
                        <div className={styles['course-frame']}>
                            {tcaCertificationName && tcaCertification ? (
                                <TCACertificationView
                                    courseData={courseData}
                                    certification={tcaCertification}
                                    certificationParam={certificationParam}
                                    userHandle={profile?.handle}
                                />
                            ) : (
                                <CourseView
                                    courseData={courseData}
                                    certification={certification}
                                    certificationParam={certificationParam}
                                    userHandle={profile?.handle}
                                />
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default CourseCompletedPage
