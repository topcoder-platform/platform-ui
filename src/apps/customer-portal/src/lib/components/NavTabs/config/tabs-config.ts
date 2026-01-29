import _ from 'lodash'

import { TabsNavItem } from '~/libs/ui'
import {
    talentSearchRouteId,
} from '~/apps/customer-portal/src/config/routes.config'

export function getTabsConfig(userRoles: string[], isAnonymous: boolean, isUnprivilegedUser: boolean): TabsNavItem[] {

    const tabs: TabsNavItem[] = [
        ...(!isUnprivilegedUser ? [{
            id: talentSearchRouteId,
            title: 'Talent Search',
        }] : []),
    ]

    return tabs
}

export function getTabIdFromPathName(
    pathname: string,
    userRoles: string[],
    isAnonymous: boolean,
    isUnprivilegedUser: boolean,
): string {
    const matchItem = _.find(getTabsConfig(
        userRoles,
        isAnonymous,
        isUnprivilegedUser,
    ), item => pathname.includes(`/${item.id}`))

    if (matchItem) {
        return matchItem.id
    }

    return ''
}
