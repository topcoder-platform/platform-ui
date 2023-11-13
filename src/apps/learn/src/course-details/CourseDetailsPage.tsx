/* eslint-disable complexity */
/* eslint-disable react/no-danger */
import { Dispatch, FC, ReactNode, SetStateAction, useContext, useMemo, useState } from 'react'
import { Params, useParams } from 'react-router-dom'
import classNames from 'classnames'

import {
    Breadcrumb,
    BreadcrumbItemModel,
    ContentLayout,
    IconOutline,
    LoadingSpinner,
} from '~/libs/ui'
import { textFormatGetSafeString } from '~/libs/shared'
import { profileContext, ProfileContextData, UserRole } from '~/libs/core'

import {
    AllCertificationsProviderData,
    CoursesProviderData,
    CourseTitle,
    EditSkillsBtn,
    ModifySkillsModal,
    PageTitle,
    ResourceProviderData,
    SkillTags,
    TCACertificationProgressBox,
    useGetCertification,
    useGetCourses,
    useGetResourceProvider,
    useGetUserCertificationProgress,
    UserCertificationProgressProviderData,
    UserCertificationProgressStatus,
} from '../lib'
import { getCoursePath } from '../learn.routes'
import { CoursePageContextValue, useCoursePageContext } from '../course-page-wrapper'

import { CourseCurriculum } from './course-curriculum'
import styles from './CourseDetailsPage.module.scss'

const CourseDetailsPage: FC<{}> = () => {
    const { buildBreadcrumbs }: CoursePageContextValue = useCoursePageContext()
    const routeParams: Params<string> = useParams()
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)

    const {
        provider: resourceProvider,
    }: ResourceProviderData = useGetResourceProvider(routeParams.provider)

    const {
        course,
        ready: courseReady,
        mutate: reloadCourse,
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

    const breadcrumbs: Array<BreadcrumbItemModel> = useMemo(() => buildBreadcrumbs([{
        name: textFormatGetSafeString(course?.title),
        url: getCoursePath(routeParams.provider as string, textFormatGetSafeString(routeParams.certification)),
    }]), [
        buildBreadcrumbs,
        course?.title,
        routeParams.certification,
        routeParams.provider,
    ])

    const canEdit: boolean = useMemo(() => !!profile?.roles?.includes(UserRole.tcaAdmin), [profile])

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

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

    function handleEditSkillsClick(): void {
        setIsEditMode(true)
    }

    function handleModyfSkillsModalClose(): void {
        setIsEditMode(false)
    }

    function handleModyfSkillsSave(): void {
        setTimeout(() => {
            setIsEditMode(false)
            reloadCourse()
        }, 1500)
    }

    return (
        <ContentLayout>
            <PageTitle>{course?.title ?? 'Course Details'}</PageTitle>

            {!ready && (
                <div className={styles.wrap}>
                    <LoadingSpinner />
                </div>
            )}
            <Breadcrumb items={breadcrumbs} />
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

                            <div className={classNames('body-small-medium', styles['skills-section-header'])}>
                                <span>Skills Covered</span>
                                {
                                    canEdit && (
                                        <EditSkillsBtn
                                            onClick={handleEditSkillsClick}
                                            className={styles.editTCABtn}
                                        />
                                    )
                                }
                            </div>
                            <SkillTags
                                skills={course.skills || []}
                                courseKey={course.id}
                                theme='gray'
                                expandCount={9}
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

                    {
                        isEditMode && (
                            <ModifySkillsModal
                                onClose={handleModyfSkillsModalClose}
                                onSave={handleModyfSkillsSave}
                                course={course}
                            />
                        )
                    }
                </>
            )}
        </ContentLayout>
    )
}

export default CourseDetailsPage
