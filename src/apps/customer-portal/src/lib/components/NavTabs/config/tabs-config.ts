import _ from 'lodash'

import { TabsNavItem } from '~/libs/ui'
import {
    assistantsRouteId,
    flexiTalentRouteId,
    showcaseSearchRouteId,
    skillStatisticsRouteId,
    statisticsRouteId,
    talentSearchRouteId,
} from '~/apps/customer-portal/src/config/routes.config'

export function getTabsConfig(userRoles: string[], isAnonymous: boolean, isUnprivilegedUser: boolean): TabsNavItem[] {

    const tabs: TabsNavItem[] = [
        ...(!isUnprivilegedUser ? [{
            id: statisticsRouteId,
            title: 'General Statistics',
        }, {
            id: skillStatisticsRouteId,
            title: 'Skill Statistics',
        }, {
            id: talentSearchRouteId,
            title: 'Talent Search',
        }, {
            id: showcaseSearchRouteId,
            title: 'Showcase',
        }, {
            id: flexiTalentRouteId,
            title: 'Flexi-Talent',
        }, {
            id: assistantsRouteId,
            title: 'Assistants',
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
