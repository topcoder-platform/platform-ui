import { TabsNavItem } from '../../../../lib'

export enum MyTabsViews {
    inProgress = 'Courses In Progress',
    completed = 'Completed Courses',
}

export const getMyTabsNavbarTabs: (
    completed: number,
    inProgress: number
) => ReadonlyArray<TabsNavItem> = (
    completed: number,
    inProgress: number
) => [
    {
        badges: [
            {count: inProgress, type: 'info'},
        ],
        id: MyTabsViews.inProgress,
        title: MyTabsViews.inProgress,
    },
    {
        badges: [
            {count: completed, type: 'info'},
        ],
        id: MyTabsViews.completed,
        title: MyTabsViews.completed,
    },
]
