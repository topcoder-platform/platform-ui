import { TabsNavItem } from '~/libs/ui'
import {
    flexiTalentRouteId,
    showcaseSearchRouteId,
    skillStatisticsRouteId,
    statisticsNavRouteId,
    statisticsRouteId,
    talentSearchRouteId,
} from '~/apps/customer-portal/src/config/routes.config'

function pathMatchesTab(pathname: string, tabId: string): boolean {
    return pathname === `/${tabId}` || pathname.startsWith(`/${tabId}/`)
}

export function getTabsConfig(userRoles: string[], isAnonymous: boolean, isUnprivilegedUser: boolean): TabsNavItem[] {

    const tabs: TabsNavItem[] = [
        ...(!isUnprivilegedUser ? [{
            children: [{
                id: statisticsRouteId,
                title: 'General Statistics',
            }, {
                id: skillStatisticsRouteId,
                title: 'Skill Statistics',
            }],
            id: statisticsNavRouteId,
            title: 'Statistics',
        }, {
            id: talentSearchRouteId,
            title: 'Talent Search',
        }, {
            id: showcaseSearchRouteId,
            title: 'Showcase',
        }, {
            id: flexiTalentRouteId,
            title: 'Flexi-Talent',
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
    const tabs = getTabsConfig(
        userRoles,
        isAnonymous,
        isUnprivilegedUser,
    )
    const matchItem = tabs.find(item => (
        item.children?.some(child => pathMatchesTab(pathname, child.id))
        || pathMatchesTab(pathname, item.id)
    ))

    if (matchItem) {
        return matchItem.id
    }

    return ''
}
