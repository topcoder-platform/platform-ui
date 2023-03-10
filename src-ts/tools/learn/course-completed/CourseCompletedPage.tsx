import { FC, ReactNode, useContext, useEffect, useMemo } from 'react'
import { NavigateFunction, Params, useLocation, useNavigate, useParams } from 'react-router-dom'

import { EnvironmentConfig } from '../../../config'
import {
    Breadcrumb,
    BreadcrumbItemModel,
    Button,
    LoadingSpinner,
    profileContext,
    ProfileContextData,
    textFormatGetSafeString,
} from '../../../lib'
import {
    AllCertificationsProviderData,
    CoursesProviderData,
    CourseTitle,
    PageTitle,
    TCACertificationCheckCompleted,
    useGetCertification,
    useGetCourses,
    useGetUserCertificationProgress,
    useLearnBreadcrumb,
    UserCertificationProgressProviderData,
    UserCertificationProgressStatus,
    useTCACertificationCheckCompleted,
    useTcaCertificationModal,
} from '../learn-lib'
import { getCertificatePath, getCoursePath, getTCACertificationPath, LEARN_PATHS, rootRoute } from '../learn.routes'

import { ReactComponent as StarsSvg } from './stars.svg'
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

    const { certification: tcaCertificationName }: TCACertificationCheckCompleted = useTCACertificationCheckCompleted(
        'FccCertificationProgress',
        progress?.id ?? '',
        { enabled: !!progress?.id },
    )

    const isLoggedIn: boolean = profileReady && !!profile
    const certificatesDataReady: boolean = progressReady && certifReady
    const ready: boolean = profileReady && courseDataReady && (!isLoggedIn || certificatesDataReady)

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

    const tcaCertificationCompletedModal: ReactNode = useTcaCertificationModal(tcaCertificationName)

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
                {`${certification?.title ?? 'Certification'} Completed`}
            </PageTitle>

            <LoadingSpinner hide={ready} />

            {ready && courseData && (
                <>
                    <Breadcrumb items={breadcrumb} />
                    <div className={styles['main-wrap']}>
                        <div className={styles['course-frame']}>
                            <div className={styles['content-wrap']}>
                                <h1>Congratulations!</h1>
                                <hr />
                                <div className='body-large'>
                                    You have successfully completed all Assessments for:
                                </div>
                                <div className={styles['course-title']}>
                                    <StarsSvg />
                                    <CourseTitle
                                        size='xl'
                                        title={courseData.title}
                                        provider={courseData.resourceProvider.name}
                                        trackType={certification?.certificationCategory.track}
                                    />
                                </div>
                                <hr />
                                <p className='body-main'>
                                    Now that you have completed the
                                    {' '}
                                    {courseData.title}
                                    ,
                                    take a look at our other Topcoder Academy courses.
                                    To view other courses, press the  &quot;Start a new course&quot; button below.
                                </p>
                                <div className={styles['btns-wrap']}>
                                    <Button
                                        size='sm'
                                        buttonStyle='secondary'
                                        label='View certificate'
                                        route={(
                                            getCertificatePath(
                                                courseData.resourceProvider.name,
                                                certificationParam,
                                            )
                                        )}
                                    />
                                    <Button
                                        size='sm'
                                        buttonStyle='primary'
                                        label='Start a new course'
                                        route={rootRoute}
                                    />
                                </div>
                                <p className='body-main'>
                                    Completed courses in the Academy will reflect on your Topcoder profile.
                                    This will make your Topcoder profile more attractive to potential employers
                                    via Gig work, and shows the community how well you&apos;ve progressed in completing
                                    learning courses.
                                </p>
                                <div className={styles['btns-wrap']}>
                                    <Button
                                        buttonStyle='link'
                                        label='See your updated profile'
                                        url={`${EnvironmentConfig.TOPCODER_URLS.USER_PROFILE}/${profile?.handle}`}
                                        target='_blank'
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {tcaCertificationCompletedModal}
                </>
            )}
        </>
    )
}

export default CourseCompletedPage
