import { TabsNavItem } from '~/libs/ui'

export enum AccountSettingsTabViews {
    account = '0',
    preferences = '1',
    payment = '2',
}

export const AccountSettingsTabsConfig: TabsNavItem[] = [
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
