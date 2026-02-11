import _ from 'lodash'

import { TabsNavItem } from '~/libs/ui'

import {
    ADMIN_ROLES,
    COPILOT_ROLES,
    MANAGER_ROLES,
    READ_ONLY_ROLES,
    TASK_MANAGER_ROLES,
} from '../../../../config/index.config'
import {
    challengesRouteId,
    groupsRouteId,
    projectsRouteId,
    taasRouteId,
    usersRouteId,
} from '../../../../config/routes.config'

function hasAnyRole(userRoles: string[], roles: string[]): boolean {
    return userRoles.some(role => roles.includes(role.toLowerCase()))
}

export function getTabsConfig(userRoles: string[], isAnonymous: boolean): TabsNavItem[] {
    if (isAnonymous) {
        return []
    }

    const tabs: TabsNavItem[] = [
        {
            id: challengesRouteId,
            title: 'Challenges',
        },
        {
            id: projectsRouteId,
            title: 'Projects',
        },
        {
            id: taasRouteId,
            title: 'TaaS Projects',
        },
    ]

    const isReadOnly = hasAnyRole(userRoles, READ_ONLY_ROLES)
    const isAdmin = hasAnyRole(userRoles, ADMIN_ROLES)
    const isCopilot = hasAnyRole(userRoles, COPILOT_ROLES)
    const isManager = hasAnyRole(userRoles, [...MANAGER_ROLES, ...TASK_MANAGER_ROLES])

    if (!isReadOnly) {
        tabs.push({
            id: usersRouteId,
            title: 'Users',
        })
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
