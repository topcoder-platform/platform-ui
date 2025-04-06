import _ from 'lodash'

import { TabsNavItem } from '~/libs/ui'
import {
    activeReviewAssigmentsRouteId,
    openOpportunitiesRouteId,
    pastReviewAssignmentsRouteId,
} from '~/apps/review/src/config/routes.config'

export const TabsConfig: TabsNavItem[] = [
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
]

export function getTabIdFromPathName(pathname: string): string {
    const matchItem = _.find(TabsConfig, item => pathname.includes(`/${item.id}`))

    if (matchItem) {
        return matchItem.id
    }

    return activeReviewAssigmentsRouteId
}
