import { TabsNavItem } from '~/libs/ui'

export enum WalletTabViews {
    home = '0',
    winnings = '1',
    taxforms = '2',
    withdrawalmethods = '3',
}

export const WalletTabsConfig: TabsNavItem[] = [
    {
        id: WalletTabViews.home,
        title: 'Wallet',
    },
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
        case WalletTabViews.home:
            return '#home'
        case WalletTabViews.winnings:
            return '#winnings'
        case WalletTabViews.taxforms:
            return '#tax-forms'
        case WalletTabViews.withdrawalmethods:
            return '#withdrawal-methods'
        default:
            return '#home'
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
            return WalletTabViews.home
    }
}
