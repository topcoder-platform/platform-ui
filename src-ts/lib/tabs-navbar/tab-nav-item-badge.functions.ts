import { TabsNavItemBadge } from './tab-nav-item-badge.model'
import { TabsNavItemBadgeType } from './tab-nav-item-badge.type'

export function set(
    badges: Array<TabsNavItemBadge>,
    type: TabsNavItemBadgeType,
    value: number,
): void {

    // if we don't have a value, don't set anything
    if (!value) {
        return
    }

    // if we have an existing badge for this type,
    // set its count and return
    const existingBadge: TabsNavItemBadge | undefined = badges.find(b => b.type === type)
    if (!!existingBadge) {
        existingBadge.count = value
        return
    }

    // add the new badge of this type
    badges.push(
        {
            count: value,
            type,
        },
    )
}
