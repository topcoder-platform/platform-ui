import {
    formatAvailability,
    formatMemberSince,
    formatPreferredRole,
} from './TalentPage.utils'

describe('TalentPage utils', () => {
    it('formats known and unknown preferred roles', () => {
        expect(formatPreferredRole('FULL_STACK_DEVELOPER'))
            .toBe('Full-Stack Developer')
        expect(formatPreferredRole('CUSTOM_ROLE_VALUE'))
            .toBe('Custom Role Value')
    })

    it('formats availability values', () => {
        expect(formatAvailability('FULL_TIME'))
            .toBe('Full-time')
        expect(formatAvailability(undefined))
            .toBe('Not specified')
    })

    it('formats member since dates', () => {
        expect(formatMemberSince('2024-02-03T00:00:00.000Z'))
            .toMatch(/2024/)
        expect(formatMemberSince('invalid'))
            .toBe('Not available')
    })
})
