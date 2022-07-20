import { authUrlLogin, PlatformRoute } from '../../lib'

import { CourseCompletedPage } from './course-completed'
import { CourseDetailsPage } from './course-details'
import { FreeCodeCamp } from './free-code-camp'
import Learn, { toolTitle } from './Learn'
import { MyCertificate } from './my-certificate'
import { MyLearning } from './my-learning'
import { WelcomePage } from './welcome'

export function getCoursePath(provider: string, certification: string): string {
    return `${rootRoute}/${provider}/${certification}`
}

export function getCertificatePath(provider: string, certification: string): string {
    return `/learn/${provider}/${certification}/certificate`
}

export function getFccLessonPath(
    provider: string,
    certification: string,
    module: string,
    lesson: string,
): string {
    return `${getCoursePath(provider, certification)}/${module}/${lesson}`
}

export enum LEARN_PATHS {
    myCertificate = '/learn/my-certificate',
    myLearning = '/learn/my-learning',
    fcc = '/learn/fcc',
    root = '/learn',
}

export const authenticateAndStartCourseRoute: string = `${authUrlLogin}${encodeURIComponent('?start-course')}`

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
