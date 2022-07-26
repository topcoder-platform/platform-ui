import { FC, useContext, useEffect, useMemo } from 'react'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'

import { EnvironmentConfig } from '../../../config'
import {
    Breadcrumb,
    BreadcrumbItemModel,
    Button,
    LoadingSpinner,
    profileContext,
    ProfileContextData
} from '../../../lib'
import {
    AllCertificationsProviderData,
    CoursesProviderData,
    CourseTitle,
    useAllCertifications,
    useCourses,
    UserCertificationProgressProviderData,
    UserCertificationProgressStatus,
    useUserCertificationProgress
} from '../learn-lib'
import { getCertificatePath, getCoursePath } from '../learn.routes'

import styles from './CourseCompletedPage.module.scss'
import { ReactComponent as StarsSvg } from './stars.svg'

const CourseCompletedPage: FC<{}> = () => {

    const navigate: NavigateFunction = useNavigate()
    const routeParams: Params<string> = useParams()
    const { profile }: ProfileContextData = useContext(profileContext)
    const providerParam: string = routeParams.provider ?? ''
    const certificationParam: string = routeParams.certification ?? ''
    const coursePath: string = getCoursePath(providerParam, certificationParam)

    const {
        course: courseData,
        ready: courseDataReady,
    }: CoursesProviderData = useCourses(providerParam, certificationParam)

    const {
        certificationProgress: progress,
        ready: progressReady,
    }: UserCertificationProgressProviderData = useUserCertificationProgress(
        profile?.userId,
        routeParams.provider,
        routeParams.certification
    )

    const {
        certification,
        ready: certifReady,
    }: AllCertificationsProviderData = useAllCertifications(providerParam, progress?.certificationId, {
        enabled: progressReady && !!progress,
    })

    const ready: boolean = progressReady && courseDataReady && certifReady

    const breadcrumb: Array<BreadcrumbItemModel> = useMemo(() => [
        { url: '/learn', name: 'Topcoder Academy' },
        { url: coursePath, name: courseData?.title ?? '' },
        { url: `/learn/completed`, name: 'Congratulations!' },
    ], [coursePath, courseData])

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
            {!ready && <LoadingSpinner />}

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
                                        credits={courseData.provider}
                                        type={certification?.category ?? ''}
                                    />
                                </div>
                                <hr />
                                <p className='body-main'>
                                    Now that you have completed the {courseData.title},
                                    take a look at our other Topcoder Academy courses.
                                    To view other courses, press the "Start a new course" button below.
                                </p>
                                <div className={styles['btns-wrap']}>
                                    <Button
                                        size='sm'
                                        buttonStyle='secondary'
                                        label='View certificate'
                                        route={getCertificatePath(courseData.provider, courseData.certification)}
                                    />
                                    <Button
                                        size='sm'
                                        buttonStyle='primary'
                                        label='Start a new course'
                                        route='/learn'
                                    />
                                </div>
                                <p className='body-main'>
                                    Completed courses in the Academy will reflect on your Topcoder profile.
                                    This will make your Topcoder profile more attractive to potential employers via Gig work,
                                    and shows the community how well you've progressed in completing learning courses.
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
                </>
            )}
        </>
    )
}

export default CourseCompletedPage
