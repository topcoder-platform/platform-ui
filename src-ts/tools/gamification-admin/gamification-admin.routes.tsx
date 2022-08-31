import { PlatformRoute } from '../../lib'
import { UserRole } from '../../lib/profile-provider/profile-functions/profile-factory/user-role.enum'

import GamificationAdmin, { toolTitle } from './GamificationAdmin'
import BadgeDetailPage from './pages/badge-detail/BadgeDetailPage'
import BadgeListingPage from './pages/badge-listing/BadgeListingPage'
import CreateBadgePage from './pages/create-badge/CreateBadgePage'

export const baseUrl: string = '/gamification-admin'
export const rolesRequired: Array<string> = [UserRole.gamificationAdmin]

export const gamificationAdminRoutes: Array<PlatformRoute> = [
    {
        authRequired: true,
        children: [
            {
                element: <BadgeListingPage />,
                route: '/',
            },
            {
                element: <CreateBadgePage />,
                route: '/create-badge',
            },
            {
                element: <BadgeDetailPage />,
                route: '/badge-detail',
            },
        ],
        element: <GamificationAdmin />,
        hidden: true,
        rolesRequired,
        route: baseUrl,
        title: toolTitle,
    },
]
