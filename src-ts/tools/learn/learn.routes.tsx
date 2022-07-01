
import { PlatformRoute } from '../../lib'
import { CourseCompletedPage } from './course-completed'

import { CourseDetailsPage } from './course-details'
import { FreeCodeCamp } from './free-code-camp'
import Learn, { toolTitle } from './Learn'
import { MyCertificate } from './my-certificate'
import { MyLearning } from './my-learning'
import { WelcomePage } from './welcome'

export function getCoursePath(provider: string, certification: string): string {
    return `/learn/${provider}/${certification}`
}

export function getFccLessonPath(
    provider: string,
    certification: string,
    module: string,
    lesson: string,
): string {
    return `/learn/${provider}/${certification}/${module}/${lesson}`
}

export enum LEARN_PATHS {
    myCertificate = '/learn/my-certificate',
    myLearning = '/learn/my-learning',
}

export const learnRoutes: Array<PlatformRoute> = [
    {
        children: [
            {
                children: [],
                element: <WelcomePage />,
                enabled: true,
                route: '',
                title: toolTitle,
            },
            {
                children: [],
                element: <CourseDetailsPage />,
                enabled: true,
                route: ':provider/:certification',
                title: toolTitle,
            },
            {
                children: [],
                element: <CourseCompletedPage />,
                enabled: true,
                route: ':provider/:certification/completed',
                title: toolTitle,
            },
            {
                children: [],
                element: <MyCertificate />,
                enabled: true,
                route: ':provider/:certification/certificate',
                title: toolTitle,
            },
            {
                children: [],
                element: <FreeCodeCamp />,
                enabled: true,
                route: ':provider/:certification/:module/:lesson',
                title: toolTitle,
            },
            {
                children: [],
                element: <MyLearning />,
                enabled: true,
                route: 'my-learning',
                title: toolTitle,
            },
        ],
        element: <Learn />,
        enabled: true,
        memberOnly: true,
        route: '/learn',
        title: toolTitle,
    },
]
