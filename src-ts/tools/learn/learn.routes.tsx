
import { PlatformRoute } from '../../lib'

import { CourseDetailsPage } from './course-details'
import { FreeCodeCamp } from './free-code-camp'
import Learn, { toolTitle } from './Learn'
import { MyLearning } from './my-learning'
import { WelcomePage } from './welcome'

interface IGetFccLessonPathParams {
    course: string
    lesson: string
    module: string
}

export const getCoursePath: (certification: string) => string = (certification: string) => {
    return `/learn/${certification}`
}

export const getFccLessonPath: (params: IGetFccLessonPathParams) => string = (params: IGetFccLessonPathParams) => (
    `/learn/fcc?course=${params.course}&module=${params.module}&lesson=${params.lesson}`
)

export enum LEARN_PATHS {
    myLearning = '/learn/my-learning',
    fcc = '/learn/fcc',
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
                route: ':certification',
                title: toolTitle,
            },
            {
                children: [],
                element: <FreeCodeCamp />,
                enabled: true,
                route: 'fcc',
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
