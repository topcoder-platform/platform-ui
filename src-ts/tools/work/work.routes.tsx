import { EnvironmentConfig } from '../../config'
import { IconOutline, PlatformRoute } from '../../lib'

import { Dashboard } from './dashboard'
import { default as Work, toolTitle } from './Work'
import { WorkIntake } from './work-intake'

export const workRoutes: Array<PlatformRoute> = [
    {
        children: [
            {
                children: [],
                element: <Dashboard />,
                enabled: true,
                icon: IconOutline.MailIcon,
                route: '',
                title: 'Home',
            },
            {
                children: [],
                element: <WorkIntake />,
                enabled: true,
                route: '/create',
                title: toolTitle,
            },
        ],
        element: <Work />,
        enabled: !EnvironmentConfig.DISABLED_TOOLS?.includes(toolTitle),
        route: '/work',
        title: toolTitle,
    },
]
