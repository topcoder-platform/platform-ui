import { canAccessTalentReport } from './talent-access.utils'

describe('talent-access utils', () => {
    it('allows administrators and Talent Managers to access the Talent report', () => {
        expect(canAccessTalentReport(['administrator']))
            .toBe(true)
        expect(canAccessTalentReport([' Talent Manager ']))
            .toBe(true)
    })

    it('denies users without a Talent report role', () => {
        expect(canAccessTalentReport(['Topcoder User']))
            .toBe(false)
        expect(canAccessTalentReport(undefined))
            .toBe(false)
    })
})
