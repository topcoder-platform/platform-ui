/* eslint-disable import/no-extraneous-dependencies */
import {
    getHashFromTabId,
    getTabIdFromHash,
    getWalletAdminTabs,
    WalletAdminTabViews,
} from './wallet-tabs-config'

function tabIds(roles: string[]): string[] {
    return getWalletAdminTabs(roles)
        .map(tab => tab.id)
}

describe('getWalletAdminTabs', () => {
    it('shows Trolley Logs, and not Payments, to Admins without a payment role', () => {
        expect(tabIds(['administrator']))
            .toEqual([WalletAdminTabViews.home, WalletAdminTabViews.trolleyLogs])
    })

    it('shows every tab to Admins who also have a payment role', () => {
        expect(tabIds(['administrator', 'Payment Admin']))
            .toEqual([
                WalletAdminTabViews.home,
                WalletAdminTabViews.payments,
                WalletAdminTabViews.trolleyLogs,
            ])
    })

    it.each([
        ['Payment Admin'],
        ['Payment BA Admin'],
        ['Payment Viewer'],
    ])('hides Trolley Logs from %s', role => {
        expect(tabIds([role]))
            .toEqual([WalletAdminTabViews.home, WalletAdminTabViews.payments])
    })

    it('titles the tab Trolley Logs', () => {
        expect(getWalletAdminTabs(['administrator'])
            .find(tab => tab.id === WalletAdminTabViews.trolleyLogs)?.title)
            .toBe('Trolley Logs')
    })
})

describe('trolley logs tab hash', () => {
    it('maps the tab to #trolley-logs and back', () => {
        expect(getHashFromTabId(WalletAdminTabViews.trolleyLogs))
            .toBe('#trolley-logs')
        expect(getTabIdFromHash('#trolley-logs'))
            .toBe(WalletAdminTabViews.trolleyLogs)
    })
})
