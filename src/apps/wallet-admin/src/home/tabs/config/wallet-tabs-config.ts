import { TabsNavItem } from '~/libs/ui'

import { canAccessDuplicatePaymentsReport } from '../../../config/access.config'

export enum WalletAdminTabViews {
    home = '0',
    payments = '1',
    duplicatePayments = '2',
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

const DuplicatePaymentsTabConfig: TabsNavItem = {
    id: WalletAdminTabViews.duplicatePayments,
    title: 'Duplicate Payments',
}

/**
 * Returns the tabs the member can see.
 *
 * @param roles Profile roles from Auth0.
 * @returns The base tabs, plus Duplicate Payments for Payment Admins.
 */
export function getWalletAdminTabs(roles: string[] | undefined): TabsNavItem[] {
    return canAccessDuplicatePaymentsReport(roles)
        ? [...WalletAdminTabsConfig, DuplicatePaymentsTabConfig]
        : WalletAdminTabsConfig
}

export function getHashFromTabId(tabId: string): string {
    switch (tabId) {
        case WalletAdminTabViews.home:
            return '#home'
        case WalletAdminTabViews.payments:
            return '#payments'
        case WalletAdminTabViews.duplicatePayments:
            return '#duplicate-payments'
        default:
            return '#home'
    }
}

export function getTabIdFromHash(hash: string): string {
    switch (hash) {
        case '#payments':
            return WalletAdminTabViews.payments
        case '#duplicate-payments':
            return WalletAdminTabViews.duplicatePayments
        default:
            return WalletAdminTabViews.home
    }
}
