import { PlatformRoute } from '../../lib'

import GamificationAdmin, { baseUrl, toolTitle } from './GamificationAdmin'
import BadgeDetailPage from './pages/badge-detail/BadgeDetailPage'
import BadgeListingPage from './pages/badge-listing/BadgeListingPage'
import CreateBadgePage from './pages/create-badge/CreateBadgePage'

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
        route: baseUrl,
        title: toolTitle,
    },
]
