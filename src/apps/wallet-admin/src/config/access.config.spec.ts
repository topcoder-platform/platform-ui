/* eslint-disable import/no-extraneous-dependencies */
import {
    canAccessDuplicatePaymentsReport,
    canAccessWalletAdmin,
    WALLET_ADMIN_ALLOWED_ROLES,
} from './access.config'

describe('canAccessWalletAdmin', () => {
    it.each([...WALLET_ADMIN_ALLOWED_ROLES])('allows %s', role => {
        expect(canAccessWalletAdmin([role]))
            .toBe(true)
    })

    it('allows a payment role regardless of casing', () => {
        expect(canAccessWalletAdmin(['payment admin']))
            .toBe(true)
    })

    it('denies members without a payment role', () => {
        expect(canAccessWalletAdmin(['Topcoder User']))
            .toBe(false)
        expect(canAccessWalletAdmin([]))
            .toBe(false)
        expect(canAccessWalletAdmin(undefined))
            .toBe(false)
    })
})

describe('canAccessDuplicatePaymentsReport', () => {
    it('allows Payment Admin regardless of casing', () => {
        expect(canAccessDuplicatePaymentsReport(['Payment Admin']))
            .toBe(true)
        expect(canAccessDuplicatePaymentsReport([' payment admin ']))
            .toBe(true)
    })

    it.each(WALLET_ADMIN_ALLOWED_ROLES.filter(role => role !== 'Payment Admin'))('denies %s', role => {
        expect(canAccessDuplicatePaymentsReport([role]))
            .toBe(false)
    })

    it('denies members without roles', () => {
        expect(canAccessDuplicatePaymentsReport([]))
            .toBe(false)
        expect(canAccessDuplicatePaymentsReport(undefined))
            .toBe(false)
    })
})
