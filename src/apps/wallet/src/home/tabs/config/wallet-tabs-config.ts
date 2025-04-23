import { TabsNavItem } from '~/libs/ui'

export enum WalletTabViews {
    home = '0',
    winnings = '1',
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
]

export function getHashFromTabId(tabId: string): string {
    switch (tabId) {
        case WalletTabViews.home:
            return '#home'
        case WalletTabViews.winnings:
            return '#winnings'
        default:
            return '#home'
    }
}

export function getTabIdFromHash(hash: string): string {
    switch (hash) {
        case '#winnings':
            return WalletTabViews.winnings
        default:
            return WalletTabViews.home
    }
}
