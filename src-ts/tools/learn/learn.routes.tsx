import { authUrlLogin, lazyLoad, LazyLoadedComponent, PlatformRoute } from '../../lib'

import { toolTitle } from './Learn'
import { LearnConfig } from './learn-config'

const WelcomePage: LazyLoadedComponent = lazyLoad(() => import('./welcome'), 'WelcomePage')
const CourseDetailsPage: LazyLoadedComponent = lazyLoad(() => import('./course-details'), 'CourseDetailsPage')
const CourseCompletedPage: LazyLoadedComponent = lazyLoad(() => import('./course-completed'), 'CourseCompletedPage')
const MyCertificate: LazyLoadedComponent = lazyLoad(() => import('./course-certificate'), 'MyCertificate')
const UserCertificate: LazyLoadedComponent = lazyLoad(() => import('./course-certificate'), 'UserCertificate')
const FreeCodeCamp: LazyLoadedComponent = lazyLoad(() => import('./free-code-camp'), 'FreeCodeCamp')
const MyLearning: LazyLoadedComponent = lazyLoad(() => import('./my-learning'), 'MyLearning')
const LandingLearn: LazyLoadedComponent = lazyLoad(() => import('./Learn'))

export enum LEARN_PATHS {
    certificate = '/certificate',
    completed = '/learn/completed',
    myCertificate = '/learn/my-certificate',
    myLearning = '/learn/my-learning',
    fcc = '/learn/fcc',
    root = '/learn',
    startCourseRouteFlag = 'start-course',
}

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
                element: <MyLearning />,
                id: 'My Learning',
                route: 'my-learning',
            },
        ],
        element: <LandingLearn />,
        id: toolTitle,
        route: rootRoute,
    },
]
