import { TabsNavItem } from '../../../lib'
import { WorkStatus, WorkStatusFilter } from '../work-lib'

export const workDashboardTabs: ReadonlyArray<TabsNavItem> = [
    {
        id: WorkStatusFilter.draft,
        title: WorkStatus.draft,
    },
    {
        id: WorkStatusFilter.active,
        title: WorkStatus.active,
    },
    {
        id: WorkStatusFilter.ready,
        title: WorkStatus.ready,
    },
    {
        id: WorkStatusFilter.transferred,
        title: WorkStatus.transferred,
    },
    {
        id: WorkStatusFilter.done,
        title: WorkStatus.done,
    },
    {
        id: WorkStatusFilter.all,
        title: 'All',
    },
]
