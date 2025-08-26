import _ from 'lodash'

import { TabsNavItem } from '~/libs/ui'
import {
    activeReviewAssigmentsRouteId,
    openOpportunitiesRouteId,
    pastReviewAssignmentsRouteId,
    scorecardRouteId,
} from '~/apps/review/src/config/routes.config'

export function getTabsConfig(): TabsNavItem[] {
    const tabs: TabsNavItem[] = [
        {
            id: activeReviewAssigmentsRouteId,
            title: 'Active Review Assignments',
        },
        {
            id: openOpportunitiesRouteId,
            title: 'Open Opportunities',
        },
        {
            id: pastReviewAssignmentsRouteId,
            title: 'Past Review Assignments',
        },
        {
            id: scorecardRouteId,
            title: 'Scorecards',
        },
    ]

    return tabs
}

export function getTabIdFromPathName(pathname: string): string {
    const matchItem = _.find(getTabsConfig(), item => pathname.includes(`/${item.id}`))

    if (matchItem) {
        return matchItem.id
    }

    return activeReviewAssigmentsRouteId
}
