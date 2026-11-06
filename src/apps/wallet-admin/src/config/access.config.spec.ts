/* eslint-disable import/no-extraneous-dependencies */
import {
    canAccessPayments,
    canAccessTrolleyLogs,
    canAccessWalletAdmin,
    WALLET_ADMIN_ALLOWED_ROLES,
    WALLET_ADMIN_PAYMENT_ROLES,
} from './access.config'

describe('canAccessWalletAdmin', () => {
    it.each([...WALLET_ADMIN_ALLOWED_ROLES])('allows %s', role => {
        expect(canAccessWalletAdmin([role]))
            .toBe(true)
    })

    it('allows a role regardless of casing', () => {
        expect(canAccessWalletAdmin(['payment admin']))
            .toBe(true)
        expect(canAccessWalletAdmin(['Administrator']))
            .toBe(true)
    })

    it('denies members without a payment or Admin role', () => {
        expect(canAccessWalletAdmin(['Topcoder User']))
            .toBe(false)
        expect(canAccessWalletAdmin([]))
            .toBe(false)
        expect(canAccessWalletAdmin(undefined))
            .toBe(false)
    })
})

describe('canAccessPayments', () => {
    it.each([...WALLET_ADMIN_PAYMENT_ROLES])('allows %s', role => {
        expect(canAccessPayments([role]))
            .toBe(true)
    })

    it('denies Admins without a payment role', () => {
        expect(canAccessPayments(['administrator']))
            .toBe(false)
    })
})

describe('canAccessTrolleyLogs', () => {
    it('allows Admins regardless of casing', () => {
        expect(canAccessTrolleyLogs(['administrator']))
            .toBe(true)
        expect(canAccessTrolleyLogs([' Administrator ']))
            .toBe(true)
    })

    it.each([...WALLET_ADMIN_PAYMENT_ROLES])('denies %s', role => {
        expect(canAccessTrolleyLogs([role]))
            .toBe(false)
    })

    it('denies members without roles', () => {
        expect(canAccessTrolleyLogs([]))
            .toBe(false)
        expect(canAccessTrolleyLogs(undefined))
            .toBe(false)
    })
})
