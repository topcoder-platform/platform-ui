import { PlatformRoute, UserRole } from '../../lib'

import GamificationAdmin, { toolTitle } from './GamificationAdmin'
import BadgeDetailPage from './pages/badge-detail/BadgeDetailPage'
import BadgeListingPage from './pages/badge-listing/BadgeListingPage'
import CreateBadgePage from './pages/create-badge/CreateBadgePage'

export const baseDetailPath: string = '/badge-detail'
export const createBadgePath: string = '/create-badge'

export const basePath: string = '/gamification-admin'

export function badgeDetailPath(badgeId: string, view?: 'edit' | 'award'): string {
    return `${basePath}${baseDetailPath}/${badgeId}${!!view ? `#${view}` : ''}`
}

export const createBadgeRoute: string = `${basePath}${createBadgePath}`

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
                route: createBadgePath,
            },
            {
                element: <BadgeDetailPage />,
                route: `${baseDetailPath}/:id`,
            },
        ],
        element: <GamificationAdmin />,
        hidden: true,
        rolesRequired: [
            UserRole.gamificationAdmin,
        ],
        route: basePath,
        title: toolTitle,
    },
]
