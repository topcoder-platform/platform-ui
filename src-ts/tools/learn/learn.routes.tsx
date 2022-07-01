
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
    return `${LEARN_PATHS.root}/${certification}`
}

export const getFccLessonPath: (params: IGetFccLessonPathParams) => string = (params: IGetFccLessonPathParams) => (
    `${LEARN_PATHS.root}/fcc?course=${params.course}&module=${params.module}&lesson=${params.lesson}`
)

export enum LEARN_PATHS {
    myLearning = '/learn/my-learning',
    fcc = '/learn/fcc',
    root = '/learn',
}

export const rootRoute: string = LEARN_PATHS.root

export const learnRoutes: Array<PlatformRoute> = [
    {
        children: [
            {
                children: [],
                element: <WelcomePage />,
                route: '',
                title: toolTitle,
            },
            {
                children: [],
                element: <CourseDetailsPage />,
                route: ':certification',
                title: toolTitle,
            },
            {
                children: [],
                element: <FreeCodeCamp />,
                route: 'fcc',
                title: toolTitle,
            },
            {
                children: [],
                element: <MyLearning />,
                route: 'my-learning',
                title: toolTitle,
            },
        ],
        element: <Learn />,
        memberOnly: true,
        route: LEARN_PATHS.root,
        title: toolTitle,
    },
]
