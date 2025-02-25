import { AppSubdomain, ToolTitle } from '~/config'
import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
    Rewrite,
    UserRole,
} from '~/libs/core'

import {
    manageChallengeRouteId,
    rootRoute,
    userManagementRouteId,
} from './config/routes.config'

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

const UserManagementPage: LazyLoadedComponent = lazyLoad(
    () => import('./user-management/UserManagementPage'),
    'UserManagementPage',
)

export const toolTitle: string = ToolTitle.admin

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
            // User Management Module
            {
                element: <UserManagementPage />,
                id: userManagementRouteId,
                route: userManagementRouteId,
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
