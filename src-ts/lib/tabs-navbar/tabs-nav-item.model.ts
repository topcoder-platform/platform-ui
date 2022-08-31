import { TabsNavItemBadge } from './tab-nav-item-badge.model'

export interface TabsNavItem {
    badges?: Array<TabsNavItemBadge>
    id: string
    title: string
}
