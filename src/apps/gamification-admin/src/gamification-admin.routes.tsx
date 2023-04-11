import { lazyLoad, LazyLoadedComponent, PlatformRoute, UserRole } from '~/libs/core'

import { toolTitle } from './GamificationAdmin'

const GamificationAdmin: LazyLoadedComponent = lazyLoad(() => import('./GamificationAdmin'))
const BadgeDetailPage: LazyLoadedComponent = lazyLoad(() => import('./pages/badge-detail/BadgeDetailPage'))
const BadgeListingPage: LazyLoadedComponent = lazyLoad(() => import('./pages/badge-listing/BadgeListingPage'))
const CreateBadgePage: LazyLoadedComponent = lazyLoad(() => import('./pages/create-badge/CreateBadgePage'))

export const baseDetailPath: string = '/badge-detail'
export const createBadgePath: string = '/create-badge'

export const basePath: string = '/gamification-admin'

export function badgeDetailPath(badgeId: string, view?: 'edit' | 'award'): string {
    return `${basePath}${baseDetailPath}/${badgeId}${!!view ? `#${view}` : ''}`
}

export const createBadgeRoute: string = `${basePath}${createBadgePath}`

export const gamificationAdminRoutes: ReadonlyArray<PlatformRoute> = [
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
        id: toolTitle,
        rolesRequired: [
            UserRole.gamificationAdmin,
        ],
        route: basePath,
    },
]
