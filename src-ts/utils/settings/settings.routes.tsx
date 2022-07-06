import { ToolTitle } from '../../config'
import { PlatformRoute } from '../../lib'

import { Account } from './account'
import Settings from './Settings'

export const settingsRoutes: Array<PlatformRoute> = [
    {
        children: [
            {
                children: [],
                element: <Account />,
                route: '',
                title: ToolTitle.settings,
            },
        ],
        element: <Settings />,
        requireAuth: true,
        route: '/account',
        title: ToolTitle.settings,
    },
]
