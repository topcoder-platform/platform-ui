import { TabsNavItem } from '~/libs/ui'

export enum BadgeDetailsTabViews {
    awardedMembers = 'Awarded Members',
    manualAward = 'Manual Award',
    batchAward = 'Batch Award',
}

export const badgeDetailsTabs: ReadonlyArray<TabsNavItem> = [
    {
        id: BadgeDetailsTabViews.awardedMembers,
        title: 'Awarded Members',
    },
    {
        id: BadgeDetailsTabViews.manualAward,
        title: 'Manual Award',
    },
    {
        id: BadgeDetailsTabViews.batchAward,
        title: 'Batch Award',
    },
]
