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
    manageReviewRouteId,
    permissionManagementRouteId,
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
const ManageResourcePage: LazyLoadedComponent = lazyLoad(
    () => import('./challenge-management/ManageResourcePage'),
    'ManageResourcePage',
)
const AddResourcePage: LazyLoadedComponent = lazyLoad(
    () => import('./challenge-management/AddResourcePage'),
    'AddResourcePage',
)
const UserManagementPage: LazyLoadedComponent = lazyLoad(
    () => import('./user-management/UserManagementPage'),
    'UserManagementPage',
)
const ReviewManagement: LazyLoadedComponent = lazyLoad(
    () => import('./review-management/ReviewManagement'),
)
const ReviewManagementPage: LazyLoadedComponent = lazyLoad(
    () => import('./review-management/ReviewManagementPage'),
    'ReviewManagementPage',
)
const ManageReviewerPage: LazyLoadedComponent = lazyLoad(
    () => import('./review-management/ManageReviewerPage'),
    'ManageReviewerPage',
)
const PermissionManagement: LazyLoadedComponent = lazyLoad(
    () => import('./permission-management/PermissionManagement'),
)
const PermissionRolesPage: LazyLoadedComponent = lazyLoad(
    () => import('./permission-management/PermissionRolesPage'),
    'PermissionRolesPage',
)
const PermissionRoleMembersPage: LazyLoadedComponent = lazyLoad(
    () => import('./permission-management/PermissionRoleMembersPage'),
    'PermissionRoleMembersPage',
)
const PermissionAddRoleMembersPage: LazyLoadedComponent = lazyLoad(
    () => import('./permission-management/PermissionAddRoleMembersPage'),
    'PermissionAddRoleMembersPage',
)
const PermissionGroupsPage: LazyLoadedComponent = lazyLoad(
    () => import('./permission-management/PermissionGroupsPage'),
    'PermissionGroupsPage',
)
const PermissionGroupMembersPage: LazyLoadedComponent = lazyLoad(
    () => import('./permission-management/PermissionGroupMembersPage'),
    'PermissionGroupMembersPage',
)
const PermissionAddGroupMembersPage: LazyLoadedComponent = lazyLoad(
    () => import('./permission-management/PermissionAddGroupMembersPage'),
    'PermissionAddGroupMembersPage',
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
                    {
                        element: <ManageResourcePage />,
                        id: 'manage-resource',
                        route: ':challengeId/manage-resource',
                    },
                    {
                        element: <AddResourcePage />,
                        id: 'add-resource',
                        route: ':challengeId/manage-resource/add',
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
            // Reviewer Management Module
            {
                children: [
                    {
                        element: <ReviewManagementPage />,
                        id: 'review-management-page',
                        route: '',
                    },
                    {
                        element: <ManageReviewerPage />,
                        id: 'manage-reviewer',
                        route: ':challengeId/manage-reviewer',
                    },
                ],
                element: <ReviewManagement />,
                id: manageReviewRouteId,
                route: manageReviewRouteId,
            },
            // Permission Management Module
            {
                children: [
                    {
                        element: <PermissionRolesPage />,
                        id: 'permission-roles-page',
                        route: 'roles',
                    },
                    {
                        element: <PermissionRoleMembersPage />,
                        id: 'permission-role-members-page',
                        route: 'roles/:roleId/role-members',
                    },
                    {
                        element: <PermissionAddRoleMembersPage />,
                        id: 'permission-add-role-members-page',
                        route: 'roles/:roleId/role-members/add',
                    },
                    {
                        element: <PermissionGroupsPage />,
                        id: 'permission-groups-page',
                        route: 'groups',
                    },
                    {
                        element: <PermissionGroupMembersPage />,
                        id: 'permission-group-members-page',
                        route: 'groups/:groupId/group-members',
                    },
                    {
                        element: <PermissionAddGroupMembersPage />,
                        id: 'permission-add-group-members-page',
                        route: 'groups/:groupId/group-members/add',
                    },
                ],
                element: <PermissionManagement />,
                id: permissionManagementRouteId,
                route: permissionManagementRouteId,
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
