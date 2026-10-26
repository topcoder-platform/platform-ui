/* eslint-disable import/no-extraneous-dependencies */
import {
    getHashFromTabId,
    getTabIdFromHash,
    getWalletAdminTabs,
    WalletAdminTabViews,
} from './wallet-tabs-config'

describe('getWalletAdminTabs', () => {
    it('adds the Duplicate Payments tab for Payment Admins', () => {
        expect(getWalletAdminTabs(['Payment Admin'])
            .map(tab => tab.id))
            .toEqual([
                WalletAdminTabViews.home,
                WalletAdminTabViews.payments,
                WalletAdminTabViews.duplicatePayments,
            ])
    })

    it('hides the Duplicate Payments tab from other payment roles', () => {
        expect(getWalletAdminTabs(['Payment Viewer', 'Payment BA Admin'])
            .map(tab => tab.id))
            .toEqual([WalletAdminTabViews.home, WalletAdminTabViews.payments])
    })
})

describe('duplicate payments tab hash', () => {
    it('maps the tab to #duplicate-payments and back', () => {
        expect(getHashFromTabId(WalletAdminTabViews.duplicatePayments))
            .toBe('#duplicate-payments')
        expect(getTabIdFromHash('#duplicate-payments'))
            .toBe(WalletAdminTabViews.duplicatePayments)
    })
})
