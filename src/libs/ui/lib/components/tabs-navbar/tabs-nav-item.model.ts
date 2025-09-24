import { TabsNavItemBadge } from './tab-nav-item-badge.model'

export interface TabsNavItem<T = string> {
    badges?: Array<TabsNavItemBadge>
    id: T
    title: string
    url?: string
    children?: TabsNavItem[]
}
