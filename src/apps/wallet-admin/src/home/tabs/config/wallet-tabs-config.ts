import { TabsNavItem } from '~/libs/ui'

export enum WalletTabViews {
    winnings = '0',
    taxforms = '1',
    withdrawalmethods = '2',
}

export const WalletAdminTabsConfig: TabsNavItem[] = [
    {
        id: WalletTabViews.winnings,
        title: 'Winnings',
    },
    {
        id: WalletTabViews.withdrawalmethods,
        title: 'Withdrawal Methods',
    },
    {
        id: WalletTabViews.taxforms,
        title: 'Tax Forms',
    },
]

export function getHashFromTabId(tabId: string): string {
    switch (tabId) {
        case WalletTabViews.winnings:
            return '#winnings'
        case WalletTabViews.taxforms:
            return '#tax-forms'
        case WalletTabViews.withdrawalmethods:
            return '#withdrawal-methods'
        default:
            return '#winnings'
    }
}

export function getTabIdFromHash(hash: string): string {
    switch (hash) {
        case '#winnings':
            return WalletTabViews.winnings
        case '#tax-forms':
            return WalletTabViews.taxforms
        case '#withdrawal-methods':
            return WalletTabViews.withdrawalmethods
        default:
            return WalletTabViews.winnings
    }
}
