import { TabsNavItem } from '~/libs/ui'

export enum WalletAdminTabViews {
    home = '0',
    payments = '1',
    taxforms = '2',
    withdrawalmethods = '3',
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
    {
        id: WalletAdminTabViews.withdrawalmethods,
        title: 'Payment Providers',
    },
    {
        id: WalletAdminTabViews.taxforms,
        title: 'Tax Forms',
    },
]

export function getHashFromTabId(tabId: string): string {
    switch (tabId) {
        case WalletAdminTabViews.home:
            return '#home'
        case WalletAdminTabViews.payments:
            return '#payments'
        case WalletAdminTabViews.taxforms:
            return '#tax-forms'
        case WalletAdminTabViews.withdrawalmethods:
            return '#payment-providers'
        default:
            return '#home'
    }
}

export function getTabIdFromHash(hash: string): string {
    switch (hash) {
        case '#payments':
            return WalletAdminTabViews.payments
        case '#tax-forms':
            return WalletAdminTabViews.taxforms
        case '#payment-providers':
            return WalletAdminTabViews.withdrawalmethods
        default:
            return WalletAdminTabViews.home
    }
}
