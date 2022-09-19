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
} from '../../../lib'
import {
    AllCertificationsProviderData,
    CoursesProviderData,
    CourseTitle,
    ResourceProviderData,
    useAllCertifications,
    useCourses,
    useLearnBreadcrumb,
    UserCertificationProgressProviderData,
    UserCertificationProgressStatus,
    useResourceProvider,
    useUserCertificationProgress
} from '../learn-lib'
import { getCoursePath } from '../learn.routes'

import { CourseCurriculum } from './course-curriculum'
import styles from './CourseDetailsPage.module.scss'
import { PromoCourse } from './promo-course'

const CourseDetailsPage: FC<{}> = () => {

    const routeParams: Params<string> = useParams()
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)

    const {
        provider: resourceProvider,
    }: ResourceProviderData = useResourceProvider(routeParams.provider)

    const {
        course,
        ready: courseReady,
    }: CoursesProviderData = useCourses(routeParams.provider ?? '', routeParams.certification)

    const {
        certificationProgress: progress,
        ready: progressReady,
    }: UserCertificationProgressProviderData = useUserCertificationProgress(
        profile?.userId,
        routeParams.provider,
        routeParams.certification,
    )

    const {
        certification: certificate,
        ready: certificateReady,
    }: AllCertificationsProviderData = useAllCertifications(routeParams.provider, course?.certificationId)

    // this looks better than finding workarounds for cyclomatic-complexity
    /* tslint:disable:cyclomatic-complexity */
    const ready: boolean = profileReady && courseReady && certificateReady && (!profile || progressReady)

    const breadcrumb: Array<BreadcrumbItemModel> = useLearnBreadcrumb([
        {
            name: course?.title ?? '',
            url: getCoursePath(routeParams.provider as string, routeParams.certification as string),
        },
    ])

    function getDescription(): ReactNode {
        if (!course) {
            return
        }

        return progress?.status === UserCertificationProgressStatus.completed ? (
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
        )
    }

    function getCompletionSuggestion(): ReactNode {
        if (!course) {
            return
        }

        return progress?.status === UserCertificationProgressStatus.completed ? (
            <></>
        ) : (
            !!course.completionSuggestions?.length && (
                <>
                    <h3 className='details mtop'>Suggestions for completing this course</h3>

                    <div
                        className={styles['text']}
                        dangerouslySetInnerHTML={{ __html: (course.completionSuggestions ?? []).join('<br /><br />') }}
                    ></div>
                </>
            )
        )
    }

    function getFooter(): ReactNode {
        if (!resourceProvider) {
            return
        }

        return (
            <div className={styles['credits-link']}>
                <a href={`//${resourceProvider.url}`} target='_blank' referrerPolicy='no-referrer' rel='noreferrer'>
                    This course was created by the {resourceProvider.url} community.
                    <IconOutline.ExternalLinkIcon />
                </a>
            </div>
        )
    }

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
                        <div className={styles['intro-copy']}>
                            <CourseTitle
                                size='lg'
                                title={course.title}
                                credits={course.provider}
                                trackType={certificate?.trackType}
                            />

                            <div
                                className={styles['text']}
                                dangerouslySetInnerHTML={{ __html: course.introCopy.join('<br /><br />') }}
                            ></div>
                        </div>

                        <div className={styles['description']}>
                            {getDescription()}
                            {getCompletionSuggestion()}
                            <div className={styles['coming-soon']}>
                                <PromoCourse />
                            </div>
                        </div>

                        <div className={styles['aside']}>
                            <CourseCurriculum
                                course={course}
                                progress={progress}
                                progressReady={progressReady}
                                profile={profile}
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
