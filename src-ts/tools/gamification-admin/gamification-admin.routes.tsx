import { PlatformRoute } from '../../lib'

import GamificationAdmin, { toolTitle } from './GamificationAdmin'

export const gamificationAdminRoutes: Array<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                element: <div><h1>Hello Gamification Admin</h1></div>,
                route: '/',
            },
        ],
        element: <GamificationAdmin />,
        hidden: true,
        route: '/gamification-admin',
        title: toolTitle,
    },
]
