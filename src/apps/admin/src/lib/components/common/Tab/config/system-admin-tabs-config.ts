import _ from 'lodash'

import { TabsNavItem } from '~/libs/ui'
import {
    manageChallengeRouteId,
    manageReviewRouteId,
    userManagementRouteId,
} from '~/apps/admin/src/config/routes.config'

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
]

export function getTabIdFromPathName(pathname: string): string {
    const matchItem = _.find(SystemAdminTabsConfig, item => pathname.includes(`/${item.id}`))

    if (matchItem) {
        return matchItem.id
    }

    if (pathname.includes(`/${manageReviewRouteId}`)) {
        return manageReviewRouteId
    }

    return manageChallengeRouteId
}
