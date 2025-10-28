import { TabsNavItem } from '~/libs/ui'

export enum WalletAdminTabViews {
    home = '0',
    payments = '1',
}

export const WalletAdminTabsConfig: TabsNavItem[] = [
    {
        id: WalletAdminTabViews.home,
        title: 'Dashboard',
    },
    {
        id: WalletAdminTabViews.payments,
        title: 'Payments',
    },
]

export function getHashFromTabId(tabId: string): string {
    switch (tabId) {
        case WalletAdminTabViews.home:
            return '#home'
        case WalletAdminTabViews.payments:
            return '#payments'
        default:
            return '#home'
    }
}

export function getTabIdFromHash(hash: string): string {
    switch (hash) {
        case '#payments':
            return WalletAdminTabViews.payments
        default:
            return WalletAdminTabViews.home
    }
}
