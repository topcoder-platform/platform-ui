import { shouldUseUpdateTraitAction } from './trait-action.utils'

describe('shouldUseUpdateTraitAction', () => {
    it('returns true when the initial trait exists', () => {
        expect(shouldUseUpdateTraitAction({ traitId: 'software' }, undefined))
            .toBe(true)
    })

    it('returns true when local traits exist even without the initial trait', () => {
        expect(shouldUseUpdateTraitAction(undefined, [{ name: 'Chrome' }]))
            .toBe(true)
    })

    it('returns false when both initial and local traits are missing', () => {
        expect(shouldUseUpdateTraitAction(undefined, undefined))
            .toBe(false)
    })
})
