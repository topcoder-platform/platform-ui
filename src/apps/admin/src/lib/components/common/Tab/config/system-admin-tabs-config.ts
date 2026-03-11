import _ from 'lodash'

import { TabsNavItem } from '~/libs/ui'
import { canAccessAdminReports, isAdministrator } from '~/apps/admin/src/lib/utils'
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
    termsRouteId,
    userManagementRouteId,
} from '~/apps/admin/src/config/routes.config'
import { platformSkillRouteId } from '~/apps/admin/src/platform/routes.config'

export const SystemAdminTabsConfig: TabsNavItem[] = [
    {
        id: manageChallengeRouteId,
        title: 'Challenge Management',
    },
    {
        id: userManagementRouteId,
        title: 'User Management',
    },
    {
        id: manageReviewRouteId,
        title: 'Review Management',
    },
    {
        children: [
            {
                id: `${billingAccountRouteId}/clients`,
                title: 'Clients',
            },
            {
                id: `${billingAccountRouteId}/billing-accounts`,
                title: 'Billing Accounts',
            },
        ],
        id: billingAccountRouteId,
        title: 'Billing Account',
    },
    {
        children: [
            {
                id: `${permissionManagementRouteId}/roles`,
                title: 'Roles',
            },
            {
                id: `${permissionManagementRouteId}/groups`,
                title: 'Groups',
            },
        ],
        id: permissionManagementRouteId,
        title: 'Permission Management',
    },
    {
        children: [
            {
                id: `${platformRouteId}/${platformSkillRouteId}`,
                title: 'Skills',
            },
            {
                id: `${platformRouteId}/${gamificationAdminRouteId}`,
                title: 'Badges',
            },
            {
                id: `${platformRouteId}/${termsRouteId}`,
                title: 'Terms',
            },
            {
                id: `${platformRouteId}/${defaultReviewersRouteId}`,
                title: 'Default Reviewers',
            },
        ],
        id: platformRouteId,
        title: 'Platform',
    },
    {
        id: paymentsRouteId,
        title: 'Payments',
    },
    {
        id: reportsRouteId,
        title: 'Reports',
    },
]

/**
 * Returns the visible system-admin tabs for the current user.
 */
export function getSystemAdminTabs(roles?: string[]): TabsNavItem[] {
    if (isAdministrator(roles)) {
        return SystemAdminTabsConfig
    }

    if (canAccessAdminReports(roles)) {
        return SystemAdminTabsConfig.filter(item => item.id === reportsRouteId)
    }

    return []
}

/**
 * Resolves the active tab id for the current location and visible tab set.
 */
export function getTabIdFromPathName(pathname: string, tabs: TabsNavItem[] = SystemAdminTabsConfig): string {
    const matchItem = _.find(tabs, item => pathname.includes(`/${item.id}`))

    if (matchItem) {
        return matchItem.id
    }

    if (tabs.some(item => item.id === manageReviewRouteId) && pathname.includes(`/${manageReviewRouteId}`)) {
        return manageReviewRouteId
    }

    return (tabs[0]?.id as string) || reportsRouteId
}
