import { TabsNavItem } from '~/libs/ui'

export enum WalletTabViews {
    home,
    winnings,
    payout,
}

export const WalletTabsConfig: TabsNavItem<WalletTabViews>[] = [
    {
        id: WalletTabViews.home,
        title: 'Wallet',
    },
    {
        id: WalletTabViews.winnings,
        title: 'Winnings',
    },
    {
        id: WalletTabViews.payout,
        title: 'Payout',
    },
]

export function getHashFromTabId(tabId: WalletTabViews): string {
    switch (tabId) {
        case WalletTabViews.winnings:
            return '#winnings'
        case WalletTabViews.payout:
            return '#payout'
        default:
            return '#home'
    }
}

export function getTabIdFromHash(hash: string): WalletTabViews {
    switch (true) {
        case hash.startsWith('#winnings'):
            return WalletTabViews.winnings
        case hash.startsWith('#payout'):
            return WalletTabViews.payout
        default:
            return WalletTabViews.home
    }
}
