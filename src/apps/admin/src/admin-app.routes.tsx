import { AppSubdomain, EnvironmentConfig, ToolTitle } from '~/config'
import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
    Rewrite,
    UserRole,
} from '~/libs/core'


const AdminApp: LazyLoadedComponent = lazyLoad(() => import('./AdminApp'))

const ChallengeManagement: LazyLoadedComponent = lazyLoad(
    () => import('./challenge-management/ChallengeManagement'),
)
const ChallengeManagementPage: LazyLoadedComponent = lazyLoad(
    () => import('./challenge-management/ChallengeManagementPage'),
    'ChallengeManagementPage',
)
const ManageUserPage: LazyLoadedComponent = lazyLoad(
    () => import('./challenge-management/ManageUserPage'),
    'ManageUserPage',
)

// NEW: Lazy-loaded components for User Management - RichardNk24
const UserManagement: LazyLoadedComponent = lazyLoad(
    () => import('./user-management/UserManagement'),
    )
const UserManagementPage: LazyLoadedComponent = lazyLoad(
    () => import('./user-management/UserManagementPage'),
    'UserManagementPage',
)

export const toolTitle: string = ToolTitle.admin
export const rootRoute: string
    = EnvironmentConfig.SUBDOMAIN === AppSubdomain.admin
        ? ''
        : `/${AppSubdomain.admin}`
    console.log('rootRoute:', rootRoute)

export const manageChallengeRouteId = 'challenge-management'

export const manageUserRouteId = 'user-management'


export const adminRoutes: ReadonlyArray<PlatformRoute> = [
    // Admin App Root
    {
        authRequired: true,
        children: [
            {
                element: <Rewrite to={manageChallengeRouteId} />,
                route: '',
            },
            // Challenge Management Module
            {
                children: [
                    {
                        element: <ChallengeManagementPage />,
                        id: 'challenge-management-page',
                        route: '',
                    },
                    {
                        element: <ManageUserPage />,
                        id: 'manage-user',
                        route: ':challengeId/manage-user',
                    },
                ],
                element: <ChallengeManagement />,
                id: manageChallengeRouteId,
                route: manageChallengeRouteId,
            },
            {
                children: [
                    {
                        element: <UserManagementPage />,
                        id: 'user-management-page',
                        route: '',
                    },
                ],
                element: <UserManagement />,
                id: manageUserRouteId,
                route: manageUserRouteId,
            },
        ],
        domain: AppSubdomain.admin,
        element: <AdminApp />,
        id: toolTitle,
        rolesRequired: [UserRole.administrator],
        route: rootRoute,
        title: toolTitle,
    },
]
