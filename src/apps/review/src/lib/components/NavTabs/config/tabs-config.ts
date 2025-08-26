import _ from 'lodash'

import { TabsNavItem } from '~/libs/ui'
import {
    activeReviewAssigmentsRouteId,
    openOpportunitiesRouteId,
    pastReviewAssignmentsRouteId,
    scorecardRouteId,
} from '~/apps/review/src/config/routes.config'

export function getTabsConfig(userRoles: string[], isAnonymous: boolean): TabsNavItem[] {

    const tabs: TabsNavItem[] = [
        ...(isAnonymous ? [] : [{
            id: activeReviewAssigmentsRouteId,
            title: 'Active Review Assignments',
        }]),
        {
            id: openOpportunitiesRouteId,
            title: 'Open Opportunities',
        },
        ...(isAnonymous ? [] : [{
            id: pastReviewAssignmentsRouteId,
            title: 'Past Review Assignments',
        }]),
    ]

    if (userRoles.includes('administrator')) {
        tabs.push({
            id: scorecardRouteId,
            title: 'Scorecards',
        })
    }

    return tabs
}

export function getTabIdFromPathName(pathname: string, userRoles: string[], isAnonymous: boolean): string {
    const matchItem = _.find(getTabsConfig(userRoles, isAnonymous), item => pathname.includes(`/${item.id}`))

    if (matchItem) {
        return matchItem.id
    }

    return ''
}
