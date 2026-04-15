import _ from 'lodash'

import { TabsNavItem } from '~/libs/ui'

import {
    ADMIN_ROLES,
    COPILOT_ROLES,
    MANAGER_ROLES,
    TASK_MANAGER_ROLES,
} from '../../../../config/index.config'
import {
    challengesRouteId,
    engagementsRouteId,
    groupsRouteId,
    projectsRouteId,
    taasRouteId,
} from '../../../../config/routes.config'
import { canViewAllEngagements } from '../../../utils/permissions.utils'

function hasAnyRole(userRoles: string[], roles: string[]): boolean {
    return userRoles.some(role => roles.includes(role.toLowerCase()))
}

export function getTabsConfig(userRoles: string[], isAnonymous: boolean): TabsNavItem[] {
    if (isAnonymous) {
        return []
    }

    const isAdmin = hasAnyRole(userRoles, ADMIN_ROLES)
    const canViewEngagements = canViewAllEngagements(userRoles)

    const tabs: TabsNavItem[] = [
        {
            id: challengesRouteId,
            title: 'Challenges',
        },
    ]

    if (canViewEngagements) {
        tabs.push({
            id: engagementsRouteId,
            title: 'Engagements',
        })
    }

    tabs.push(
        {
            id: projectsRouteId,
            title: 'Projects',
        },
        {
            id: taasRouteId,
            title: 'TaaS Projects',
        },
    )

    const isCopilot = hasAnyRole(userRoles, COPILOT_ROLES)
    const isManager = hasAnyRole(userRoles, [...MANAGER_ROLES, ...TASK_MANAGER_ROLES])

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
