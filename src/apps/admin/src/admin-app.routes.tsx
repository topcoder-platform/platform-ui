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
    manageChallengeRouteId,
    manageReviewRouteId,
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
        ],
        domain: AppSubdomain.admin,
        element: <AdminApp />,
        id: toolTitle,
        rolesRequired: [UserRole.administrator],
        route: rootRoute,
        title: toolTitle,
    },
]
