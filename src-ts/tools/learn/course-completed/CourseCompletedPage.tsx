import { FC, useContext, useEffect, useMemo } from 'react'
import { NavigateFunction, Params, useLocation, useNavigate, useParams } from 'react-router-dom'

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
    useLearnBreadcrumb,
    UserCertificationProgressProviderData,
    UserCertificationProgressStatus,
    useTCACertificationCheckCompleted,
} from '../learn-lib'
import { getCoursePath, getTCACertificationPath, LEARN_PATHS } from '../learn.routes'

import { CourseView } from './course-view'
import { TCACertificationView } from './tca-certification-view'
import styles from './CourseCompletedPage.module.scss'

const CourseCompletedPage: FC<{}> = () => {

    const navigate: NavigateFunction = useNavigate()
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

    const location: any = useLocation()

    const breadcrumbItems: BreadcrumbItemModel[] = useMemo(() => {
        const bItems: BreadcrumbItemModel[] = [
            {
                name: courseData?.title ?? '',
                url: coursePath,
            },
            {
                name: 'Congratulations!',
                url: LEARN_PATHS.completed,
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
        location.state,
        courseData?.title,
        coursePath,
    ])

    const breadcrumb: Array<BreadcrumbItemModel> = useLearnBreadcrumb(breadcrumbItems)

    useEffect(() => {
        if (ready && progress?.status !== UserCertificationProgressStatus.completed) {
            navigate(coursePath)
        }
    }, [
        coursePath,
        navigate,
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
                    <Breadcrumb items={breadcrumb} />
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
