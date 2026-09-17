import _ from 'lodash'

import { TabsNavItem } from '~/libs/ui'

import {
    ADMIN_ROLES,
    COPILOT_ROLES,
    MANAGER_ROLES,
    TASK_MANAGER_ROLES,
} from '../../../../config/index.config'
import {
    budgetApprovalsRouteId,
    challengesRouteId,
    // engagementLeadsRouteId, // Re-enable when Leads nav tab is restored
    engagementsRouteId,
    groupsRouteId,
    projectsRouteId,
    salesRouteId,
    taasRouteId,
} from '../../../../config/routes.config'
import { canViewAllEngagements } from '../../../utils/permissions.utils'

function hasAnyRole(userRoles: string[], roles: string[]): boolean {
    return userRoles.some(role => roles.includes(role.toLowerCase()))
}

/**
 * Builds Work navigation, including Sales for Administrators and Talent Managers.
 * @param userRoles Authenticated caller roles.
 * @param isAnonymous Whether the visitor has no authenticated profile.
 * @returns Visible Work tabs; anonymous visitors receive none.
 * @throws Does not throw.
 */
export function getTabsConfig(userRoles: string[], isAnonymous: boolean): TabsNavItem[] {
    if (isAnonymous) {
        return []
    }

    const isAdmin = hasAnyRole(userRoles, ADMIN_ROLES)
    const isManager = hasAnyRole(userRoles, [...MANAGER_ROLES, ...TASK_MANAGER_ROLES])
    const canViewEngagements = canViewAllEngagements(userRoles)

    const tabs: TabsNavItem[] = [
        {
            id: challengesRouteId,
            title: 'Challenges',
        },
    ]

    if (canViewEngagements) {
        tabs.push(
            {
                id: engagementsRouteId,
                title: 'Engagements',
            },
            // Re-enable Leads nav tab when ready:
            // {
            //     id: engagementLeadsRouteId,
            //     title: 'Leads',
            // },
        )
    }

    tabs.push(
        {
            id: projectsRouteId,
            title: 'Projects',
        },
        ...(isAdmin || isManager
            ? [{
                id: budgetApprovalsRouteId,
                title: 'Budget Approvals',
            }]
            : []),
        {
            id: taasRouteId,
            title: 'TaaS Projects',
        },
    )

    const isCopilot = hasAnyRole(userRoles, COPILOT_ROLES)

    if (isAdmin || hasAnyRole(userRoles, ['talent manager'])) {
        tabs.push({ id: salesRouteId, title: 'Sales' })
    }

    if (isAdmin || isCopilot || isManager) {
        tabs.push({
            id: groupsRouteId,
            title: 'Groups',
        })
    }

    return tabs
}

export function getTabIdFromPathName(pathname: string, userRoles: string[], isAnonymous: boolean): string {
    const matchItem = _.find(
        getTabsConfig(userRoles, isAnonymous),
        item => pathname.includes(`/${item.id}`),
    )

    if (matchItem) {
        return matchItem.id
    }

    return ''
}
