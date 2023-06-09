import { TabsNavItem } from '~/libs/ui'

export enum AccountSettingsTabViews {
    tools = '0',
    account = '1',
    preferences = '2',
    payment = '3',
    tcandyou = '4',
}

export const AccountSettingsTabsConfig: TabsNavItem[] = [
    {
        id: AccountSettingsTabViews.tcandyou,
        title: 'Topcoder & You',
    },
    {
        id: AccountSettingsTabViews.tools,
        title: 'Tools',
    },
    {
        id: AccountSettingsTabViews.account,
        title: 'Account',
    },
    {
        id: AccountSettingsTabViews.preferences,
        title: 'Preferences',
    },
    {
        id: AccountSettingsTabViews.payment,
        title: 'Payment',
    },
]

export function getHashFromTabId(tabId: string): string {
    switch (tabId) {
        case AccountSettingsTabViews.tcandyou: return '#tcandyou'
        case AccountSettingsTabViews.tools: return '#tools'
        case AccountSettingsTabViews.account: return '#account'
        case AccountSettingsTabViews.preferences: return '#preferences'
        case AccountSettingsTabViews.payment: return '#payment'
        default: return '#account'
    }
}

export function getTabIdFromHash(hash: string): string {
    switch (hash) {
        case '#tcandyou': return AccountSettingsTabViews.tcandyou
        case '#tools': return AccountSettingsTabViews.tools
        case '#account': return AccountSettingsTabViews.account
        case '#preferences': return AccountSettingsTabViews.preferences
        case '#payment': return AccountSettingsTabViews.payment
        default: return AccountSettingsTabViews.account
    }
}
