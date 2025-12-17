import { baseDetailPath, createBadgePath } from '~/apps/admin/src/platform/gamification-admin'
import { AppSubdomain, ToolTitle } from '~/config'
import {
    lazyLoad,
    LazyLoadedComponent,
    PlatformRoute,
    Rewrite,
    UserRole,
} from '~/libs/core'

import {
    billingAccountRouteId,
    defaultReviewersRouteId,
    gamificationAdminRouteId,
    manageChallengeRouteId,
    manageReviewRouteId,
    paymentsRouteId,
    permissionManagementRouteId,
    platformRouteId,
    reportsRouteId,
    rootRoute,
    termsRouteId,
    userManagementRouteId,
} from './config/routes.config'
import { platformSkillRouteId } from './platform/routes.config'

const AdminApp: LazyLoadedComponent = lazyLoad(() => import('./AdminApp'))

const ChallengeManagement: LazyLoadedComponent = lazyLoad(
    () => import('./challenge-management/ChallengeManagement'),
)
const ChallengeManagementPage: LazyLoadedComponent = lazyLoad(
    () => import('./challenge-management/ChallengeManagementPage'),
    'ChallengeManagementPage',
)
const ChallengeDetailsPage: LazyLoadedComponent = lazyLoad(
    () => import('./challenge-management/ChallengeDetailsPage'),
)
const ManageUserPage: LazyLoadedComponent = lazyLoad(
    () => import('./challenge-management/ManageUserPage'),
    'ManageUserPage',
)
const ManageSubmissionPage: LazyLoadedComponent = lazyLoad(
    () => import('./challenge-management/ManageSubmissionPage'),
    'ManageSubmissionPage',
)
const ManageMarathonMatchPage: LazyLoadedComponent = lazyLoad(
    () => import('./challenge-management/ManageMarathonMatchPage'),
    'ManageMarathonMatchPage',
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
const BillingAccount: LazyLoadedComponent = lazyLoad(
    () => import('./billing-account/BillingAccount'),
)
const BillingAccountsPage: LazyLoadedComponent = lazyLoad(
    () => import('./billing-account/BillingAccountsPage'),
    'BillingAccountsPage',
)
const BillingAccountNewPage: LazyLoadedComponent = lazyLoad(
    () => import('./billing-account/BillingAccountNewPage'),
    'BillingAccountNewPage',
)
const BillingAccountDetailsPage: LazyLoadedComponent = lazyLoad(
    () => import('./billing-account/BillingAccountDetailsPage'),
    'BillingAccountDetailsPage',
)
const BillingAccountResourcesPage: LazyLoadedComponent = lazyLoad(
    () => import('./billing-account/BillingAccountResourcesPage'),
    'BillingAccountResourcesPage',
)
const BillingAccountResourceNewPage: LazyLoadedComponent = lazyLoad(
    () => import('./billing-account/BillingAccountResourceNewPage'),
    'BillingAccountResourceNewPage',
)
const ClientsPage: LazyLoadedComponent = lazyLoad(
    () => import('./billing-account/ClientsPage'),
    'ClientsPage',
)
const ClientEditPage: LazyLoadedComponent = lazyLoad(
    () => import('./billing-account/ClientEditPage'),
    'ClientEditPage',
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

const Platform: LazyLoadedComponent = lazyLoad(() => import('./platform/Platform'))
const SkillManagement: LazyLoadedComponent = lazyLoad(
    () => import('./platform/skill-management/SkillManagement'),
)
const SkillManagementLandingPage: LazyLoadedComponent = lazyLoad(
    () => import('./platform/skill-management/LandingPage'),
    'LandingPage',
)
const BadgeDetailPage: LazyLoadedComponent = lazyLoad(
    () => import('./platform/gamification-admin/src/pages/badge-detail/BadgeDetailPage'),
)
const BadgeListingPage: LazyLoadedComponent = lazyLoad(
    () => import('./platform/gamification-admin/src/pages/badge-listing/BadgeListingPage'),
)
const CreateBadgePage: LazyLoadedComponent = lazyLoad(
    () => import('./platform/gamification-admin/src/pages/create-badge/CreateBadgePage'),
)
const TermsListPage: LazyLoadedComponent = lazyLoad(
    () => import('./platform/terms/TermsListPage'),
    'TermsListPage',
)
const TermsAddPage: LazyLoadedComponent = lazyLoad(
    () => import('./platform/terms/TermsAddPage'),
    'TermsAddPage',
)
const TermsEditPage: LazyLoadedComponent = lazyLoad(
    () => import('./platform/terms/TermsEditPage'),
    'TermsEditPage',
)
const DefaultReviewersListPage: LazyLoadedComponent = lazyLoad(
    () => import('./platform/default-reviewers/DefaultReviewersListPage'),
    'DefaultReviewersListPage',
)
const DefaultReviewersAddPage: LazyLoadedComponent = lazyLoad(
    () => import('./platform/default-reviewers/DefaultReviewersAddPage'),
    'DefaultReviewersAddPage',
)
const DefaultReviewersEditPage: LazyLoadedComponent = lazyLoad(
    () => import('./platform/default-reviewers/DefaultReviewersEditPage'),
    'DefaultReviewersEditPage',
)
const TermsUsersPage: LazyLoadedComponent = lazyLoad(
    () => import('./platform/terms/TermsUsersPage'),
    'TermsUsersPage',
)

const PaymentsPage: LazyLoadedComponent = lazyLoad(
    () => import('./payments/PaymentsPage'),
    'PaymentsPage',
)
const ReportsPage: LazyLoadedComponent = lazyLoad(
    () => import('./reports/ReportsPage'),
    'ReportsPage',
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
                        element: <ChallengeDetailsPage />,
                        id: 'challenge-details',
                        route: ':challengeId',
                    },
                    {
                        element: <ManageUserPage />,
                        id: 'manage-user',
                        route: ':challengeId/manage-user',
                    },
                    {
                        element: <ManageSubmissionPage />,
                        id: 'manage-resource',
                        route: ':challengeId/manage-submission',
                    },
                    {
                        element: <ManageMarathonMatchPage />,
                        id: 'manage-marathon-match',
                        route: ':challengeId/manage-marathon-match',
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
            // Billing Account Module
            {
                children: [
                    {
                        element: <BillingAccountsPage />,
                        id: 'billing-accounts-page',
                        route: 'billing-accounts',
                    },
                    {
                        element: <BillingAccountNewPage />,
                        id: 'billing-account-new-page',
                        route: 'billing-accounts/new',
                    },
                    {
                        element: <BillingAccountDetailsPage />,
                        id: 'billing-account-details-page',
                        route: 'billing-accounts/:accountId/details',
                    },
                    {
                        element: <BillingAccountResourcesPage />,
                        id: 'billing-account-resources-page',
                        route: 'billing-accounts/:accountId/resources',
                    },
                    {
                        element: <BillingAccountNewPage />,
                        id: 'billing-account-resources-page',
                        route: 'billing-accounts/:accountId/edit',
                    },
                    {
                        element: <BillingAccountResourceNewPage />,
                        id: 'billing-account-resource-new-page',
                        route: 'billing-accounts/:accountId/resources/new',
                    },
                    {
                        element: <ClientsPage />,
                        id: 'billing-account-clients-page',
                        route: 'clients',
                    },
                    {
                        element: <ClientEditPage />,
                        id: 'billing-account-client-edit-page',
                        route: 'clients/:clientId/edit',
                    },
                    {
                        element: <ClientEditPage />,
                        id: 'billing-account-client-edit-page',
                        route: 'clients/new',
                    },
                ],
                element: <BillingAccount />,
                id: billingAccountRouteId,
                route: billingAccountRouteId,
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

            // Platform Management Module
            {
                children: [
                    {
                        children: [
                            {
                                element: <SkillManagementLandingPage />,
                                id: 'skills-landing-page',
                                route: '',
                            },
                        ],
                        element: <SkillManagement />,
                        id: platformSkillRouteId,
                        route: platformSkillRouteId,
                    },
                    {
                        element: (
                            <BadgeListingPage
                                rootPage={`${rootRoute}/${platformRouteId}/${gamificationAdminRouteId}`}
                            />
                        ),
                        route: gamificationAdminRouteId,
                    },
                    {
                        element: (
                            <CreateBadgePage
                                rootPage={`${rootRoute}/${platformRouteId}/${gamificationAdminRouteId}`}
                            />
                        ),
                        route: `${gamificationAdminRouteId}${createBadgePath}`,
                    },
                    {
                        element: (
                            <BadgeDetailPage
                                rootPage={`${rootRoute}/${platformRouteId}/${gamificationAdminRouteId}`}
                            />
                        ),
                        route: `${gamificationAdminRouteId}${baseDetailPath}/:id`,
                    },
                    {
                        element: <TermsListPage />,
                        route: termsRouteId,
                    },
                    {
                        element: <TermsAddPage />,
                        route: `${termsRouteId}/add`,
                    },
                    {
                        element: <TermsUsersPage />,
                        route: `${termsRouteId}/:id/users`,
                    },
                    {
                        element: <TermsEditPage />,
                        route: `${termsRouteId}/:id/edit`,
                    },
                    {
                        element: <DefaultReviewersListPage />,
                        route: defaultReviewersRouteId,
                    },
                    {
                        element: <DefaultReviewersAddPage />,
                        route: `${defaultReviewersRouteId}/add`,
                    },
                    {
                        element: <DefaultReviewersEditPage />,
                        route: `${defaultReviewersRouteId}/:id/edit`,
                    },
                ],
                element: <Platform />,
                id: platformRouteId,
                route: platformRouteId,
            },
            // Payments Module
            {
                element: <PaymentsPage />,
                id: paymentsRouteId,
                route: paymentsRouteId,
            },
            // Reports Module
            {
                element: <ReportsPage />,
                id: reportsRouteId,
                route: reportsRouteId,
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
