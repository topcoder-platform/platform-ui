import { EnvironmentConfig, ToolTitle } from '~/config'
import {
    authUrlLogin,
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
} from '~/libs/core'

import { LearnConfig } from './config'

const LearnAppRoot: LazyLoadedComponent = lazyLoad(() => import('./LearnApp'))
const WelcomePage: LazyLoadedComponent = lazyLoad(() => import('./welcome'), 'WelcomePage')
const CourseDetailsPage: LazyLoadedComponent = lazyLoad(() => import('./course-details'), 'CourseDetailsPage')
const CourseCompletedPage: LazyLoadedComponent = lazyLoad(() => import('./course-completed'), 'CourseCompletedPage')
const MyCertificate: LazyLoadedComponent = lazyLoad(() => import('./course-certificate'), 'MyCertificate')
const UserCertificate: LazyLoadedComponent = lazyLoad(() => import('./course-certificate'), 'UserCertificate')
const FreeCodeCamp: LazyLoadedComponent = lazyLoad(() => import('./free-code-camp'), 'FreeCodeCamp')
const CertificationDetailsPage: LazyLoadedComponent = lazyLoad(
    () => import('./certification-details'),
    'CertificationDetailsPage',
)
const EnrollmentPage: LazyLoadedComponent = lazyLoad(
    () => import('./certification-details/enrollment-page'),
    'EnrollmentPage',
)
const UserTCACertificate: LazyLoadedComponent = lazyLoad(() => import('./tca-certificate'), 'CertificateView')

const ValidateTCACertificate: LazyLoadedComponent
    = lazyLoad(() => import('./tca-certificate'), 'UuidCertificationView')

const UserCertificationView: LazyLoadedComponent
    = lazyLoad(() => import('./tca-certificate'), 'UserCertificationView')

const UserCertificationPreview: LazyLoadedComponent
    = lazyLoad(() => import('./tca-certificate'), 'UserCertificationPreview')

export enum LEARN_PATHS {
    certificate = '/certificate',
    completed = '/learn/completed',
    myLearning = '/learn/my-learning',
    fcc = '/learn/fcc',
    root = '/learn',
    startCourseRouteFlag = 'start-course',
    tcaCertifications = '/tca-certifications',
    tcaEnroll = '/enroll',
}

export const toolTitle: string = ToolTitle.tcAcademy
export const rootRoute: string = LEARN_PATHS.root
export const absoluteRootRoute: string = `${window.location.origin}${LEARN_PATHS.root}`

export function getAuthenticateAndStartCourseRoute(): string {
    return `${authUrlLogin()}${encodeURIComponent(`?${LEARN_PATHS.startCourseRouteFlag}`)}`
}

export function getCoursePath(provider: string, certification: string): string {
    return `${rootRoute}/${provider}/${certification}`
}

export function getCertificatePath(provider: string, certification: string): string {
    return `${getCoursePath(provider, certification)}${LEARN_PATHS.certificate}`
}

export function getCertificationCompletedPath(provider: string, certification: string): string {
    return `${getCoursePath(provider, certification)}/completed`
}

export function getLessonPathFromCurrentLesson(
    provider: string,
    certification: string,
    currentLesson: string | undefined,
    fallbackModule?: string,
    fallbackLesson?: string,
): string {
    const [module, lesson]: Array<string> = (currentLesson ?? '').split('/')
    return `${getCoursePath(provider, certification)}/${module || fallbackModule}/${lesson || fallbackLesson}`
}

export function getLessonPathFromModule(
    provider: string,
    certification: string,
    module: string,
    lesson: string,
): string {
    return `${getCoursePath(provider, certification)}/${module}/${lesson}`
}

export function getUserCertificateSsr(
    provider: string,
    certification: string,
    handle: string,
    title: string,
): string {
    return `${LearnConfig.CERT_DOMAIN}/${handle}/${provider}/${certification}/${encodeURI(title)}`
}

export function getUserTCACertificateSsr(
    certification: string,
    handle: string,
    title: string,
): string {
    return `${LearnConfig.CERT_DOMAIN}/${handle}/tca/${certification}/${encodeURI(title)}`
}

export function getUserCertificateUrl(
    provider: string,
    certification: string,
    handle: string,
): string {
    return `${window.location.origin}${getCoursePath(provider, certification)}/${handle}${LEARN_PATHS.certificate}`
}

export function getViewStyleParamKey(): string {
    return Object.keys(LearnConfig.CERT_ALT_PARAMS)[0]
}

export function getTCACertificationPath(certification: string): string {
    return `${LEARN_PATHS.root}${LEARN_PATHS.tcaCertifications}/${certification}`
}

export function getTCACertificationEnrollPath(certification: string): string {
    return `${LEARN_PATHS.root}${LEARN_PATHS.tcaCertifications}/${certification}${LEARN_PATHS.tcaEnroll}`
}

export function getTCACertificateUrl(
    certification: string,
    handle: string,
): string {
    return `${getTCACertificationPath(certification)}/${handle}${LEARN_PATHS.certificate}`
}

export function getTCACertificationValidationUrl(
    completionUuid: string,
): string {
    return `${EnvironmentConfig.PLATFORMUI_URL}${LEARN_PATHS.root}/${completionUuid}`
}

export function getTCAUserCertificationUrl(
    certification: string,
    handle: string,
): string {
    return `${getTCACertificationPath(certification)}/${handle}/certification`
}

export function getTCAUserCertificationPreviewUrl(
    certification: string,
): string {
    return `${getTCACertificationPath(certification)}/preview`
}

export function getAuthenticateAndEnrollRoute(): string {
    return `${authUrlLogin()}${encodeURIComponent(LEARN_PATHS.tcaEnroll)}`
}

export const learnRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            {
                children: [],
                element: <WelcomePage />,
                id: 'Welcome to Topcoder Academy',
                route: '',
            },
            {
                children: [],
                element: <CertificationDetailsPage />,
                id: 'Certification Details',
                route: 'tca-certifications/:certification',
            },
            {
                children: [],
                element: <EnrollmentPage />,
                id: 'Certification Details',
                route: 'tca-certifications/:certification/enroll',
            },
            {
                children: [],
                element: <CourseDetailsPage />,
                id: 'Course Details',
                route: ':provider/:certification',
            },
            {
                children: [],
                element: <CourseCompletedPage />,
                id: 'Course Completed',
                route: ':provider/:certification/completed',
            },
            {
                children: [],
                element: <MyCertificate />,
                id: 'My Certificate',
                route: ':provider/:certification/certificate',
            },
            {
                children: [],
                element: <UserCertificate />,
                id: 'User Certificate',
                route: ':provider/:certification/:memberHandle/certificate',
            },
            {
                children: [],
                element: <FreeCodeCamp />,
                id: 'FxreeCodeCamp',
                route: ':provider/:certification/:module/:lesson',
            },
            {
                children: [],
                element: <UserTCACertificate />,
                id: 'User TCA Certification',
                route: 'tca-certifications/:certification/:memberHandle/certificate',
            },
            {
                children: [],
                element: <ValidateTCACertificate />,
                id: 'Hiring manager view - uuid param',
                route: ':completionUuid',
            },
            {
                children: [],
                element: <UserCertificationView />,
                id: 'Hiring manager view',
                route: 'tca-certifications/:certification/:memberHandle/certification',
            },
            {
                children: [],
                element: <UserCertificationPreview />,
                id: 'Giring manager preview',
                route: 'tca-certifications/:certification/preview',
            },
        ],
        element: <LearnAppRoot />,
        id: toolTitle,
        route: rootRoute,
    },
]