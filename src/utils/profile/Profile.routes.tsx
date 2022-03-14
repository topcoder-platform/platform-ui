import { PlatformRoute } from '../../lib'

import Profile, { utilTitle } from './Profile'

export const profileRoutes: Array<PlatformRoute> = [
    {
        children: [],
        element: <Profile />,
        enabled: true,
        route: '/profile',
        title: utilTitle,
    },
]
