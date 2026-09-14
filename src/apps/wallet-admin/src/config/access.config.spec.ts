/* eslint-disable import/no-extraneous-dependencies */
import { canAccessWalletAdmin, WALLET_ADMIN_ALLOWED_ROLES } from './access.config'

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
