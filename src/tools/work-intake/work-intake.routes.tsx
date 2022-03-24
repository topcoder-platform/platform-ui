import { PlatformRoute } from '../../lib'

import WorkIntake, { toolTitle } from './WorkIntake'

export const workIntakeRoutes: Array<PlatformRoute> = [
    {
        children: [],
        element: <WorkIntake />,
        enabled: true,
        route: '/work-intake',
        title: toolTitle,
    },
]
