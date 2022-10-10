import { lazyLoad, PlatformRoute, UserRole } from '../../lib'

import { toolTitle } from './GamificationAdmin'
const GamificationAdmin = lazyLoad(() => import('./GamificationAdmin'))
const BadgeDetailPage = lazyLoad(() => import('./pages/badge-detail/BadgeDetailPage'))
const BadgeListingPage = lazyLoad(() => import('./pages/badge-listing/BadgeListingPage'))
const CreateBadgePage = lazyLoad(() => import('./pages/create-badge/CreateBadgePage'))

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
