import { authUrlLogin, PlatformRoute } from '../../lib'

import { MyCertificate, UserCertificate } from './course-certificate'
import { CourseCompletedPage } from './course-completed'
import { CourseDetailsPage } from './course-details'
import { FreeCodeCamp } from './free-code-camp'
import { default as Learn, toolTitle } from './Learn'
import { MyLearning } from './my-learning'
import { WelcomePage } from './welcome'

export function getCoursePath(provider: string, certification: string): string {
    return `${rootRoute}/${provider}/${certification}`
}

export function getCertificatePath(provider: string, certification: string): string {
    return `${getCoursePath(provider, certification)}/certificate`
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

export enum LEARN_PATHS {
    completed = '/learn/completed',
    myCertificate = '/learn/my-certificate',
    myLearning = '/learn/my-learning',
    fcc = '/learn/fcc',
    root = '/learn',
    startCourseRouteFlag = 'start-course',
}

export function getAuthenticateAndStartCourseRoute(): string {
    return `${authUrlLogin}${encodeURIComponent(`?${LEARN_PATHS.startCourseRouteFlag}`)}`
}

export const rootRoute: string = LEARN_PATHS.root

export const learnRoutes: Array<PlatformRoute> = [
    {
        children: [
            {
                children: [],
                element: <WelcomePage />,
                route: '',
                title: 'Welcome to Topcoder Academy',
            },
            {
                children: [],
                element: <CourseDetailsPage />,
                route: ':provider/:certification',
                title: 'Course Details',
            },
            {
                children: [],
                element: <CourseCompletedPage />,
                route: ':provider/:certification/completed',
                title: 'Course Completed',
            },
            {
                children: [],
                element: <MyCertificate />,
                route: ':provider/:certification/certificate',
                title: 'My Certificate',
            },
            {
                children: [],
                element: <UserCertificate />,
                route: ':provider/:certification/:memberHandle/certificate',
                title: 'User Certificate',
            },
            {
                children: [],
                element: <FreeCodeCamp />,
                route: ':provider/:certification/:module/:lesson',
                title: 'FreeCodeCamp',
            },
            {
                children: [],
                element: <MyLearning />,
                route: 'my-learning',
                title: 'My Learning',
            },
        ],
        element: <Learn />,
        memberOnly: true,
        route: rootRoute,
        title: toolTitle,
    },
]
