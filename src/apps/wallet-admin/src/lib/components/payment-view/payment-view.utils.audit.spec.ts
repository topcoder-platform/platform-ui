import {
    formatAuditActionValue,
    formatAuditTimestamp,
} from './payment-view.utils'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        ADMIN: {
            WORK_MANAGER_URL: 'https://challenges.example.com',
        },
    },
}), { virtual: true })

describe('formatAuditActionValue', () => {
    it('formats ISO timestamps in the user timezone', () => {
        const iso = '2026-06-11T05:05:29.611Z'

        expect(formatAuditActionValue(iso))
            .toBe(formatAuditTimestamp(iso))
        expect(formatAuditActionValue(iso))
            .toMatch(/^\d{2}\/\d{2}\/\d{4}, \d{1,2}:\d{2} (AM|PM)$/)
        expect(formatAuditActionValue(iso))
            .not.toContain('T')
    })

    it('formats ISO timestamps that include a timezone offset', () => {
        const iso = '2026-06-03T05:05:29.000+00:00'

        expect(formatAuditActionValue(iso))
            .toBe(formatAuditTimestamp(iso))
        expect(formatAuditActionValue(` ${iso} `))
            .toBe(formatAuditTimestamp(iso))
    })

    it('leaves non-date action values unchanged', () => {
        expect(formatAuditActionValue('OWED'))
            .toBe('OWED')
        expect(formatAuditActionValue('1000'))
            .toBe('1000')
        expect(formatAuditActionValue(' $2,000.00 '))
            .toBe('$2,000.00')
    })
})
