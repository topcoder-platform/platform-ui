import { TabsNavItem } from '~/libs/ui'

import { canAccessPayments, canAccessTrolleyLogs } from '../../../config/access.config'

export enum WalletAdminTabViews {
    home = '0',
    payments = '1',
    trolleyLogs = '2',
}

const DashboardTabConfig: TabsNavItem = {
    id: WalletAdminTabViews.home,
    title: 'Dashboard',
}

const PaymentsTabConfig: TabsNavItem = {
    id: WalletAdminTabViews.payments,
    title: 'Payments',
}

const TrolleyLogsTabConfig: TabsNavItem = {
    id: WalletAdminTabViews.trolleyLogs,
    title: 'Trolley Logs',
}

/**
 * Returns the tabs the member can see.
 *
 * @param roles Profile roles from Auth0.
 * @returns Dashboard, plus Payments for payment roles and Trolley Logs for Admins.
 */
export function getWalletAdminTabs(roles: string[] | undefined): TabsNavItem[] {
    return [
        DashboardTabConfig,
        ...(canAccessPayments(roles) ? [PaymentsTabConfig] : []),
        ...(canAccessTrolleyLogs(roles) ? [TrolleyLogsTabConfig] : []),
    ]
}

export function getHashFromTabId(tabId: string): string {
    switch (tabId) {
        case WalletAdminTabViews.home:
            return '#home'
        case WalletAdminTabViews.payments:
            return '#payments'
        case WalletAdminTabViews.trolleyLogs:
            return '#trolley-logs'
        default:
            return '#home'
    }
}

export function getTabIdFromHash(hash: string): string {
    switch (hash) {
        case '#payments':
            return WalletAdminTabViews.payments
        case '#trolley-logs':
            return WalletAdminTabViews.trolleyLogs
        default:
            return WalletAdminTabViews.home
    }
}
