import { convertToTimezoneDate } from './timezone.utils'

const originalTimezone = process.env.TZ

afterEach(() => {
    if (originalTimezone) {
        process.env.TZ = originalTimezone
        return
    }

    delete process.env.TZ
})

describe('convertToTimezoneDate', () => {
    it('returns the target timezone wall time without local timezone drift', () => {
        process.env.TZ = 'America/Los_Angeles'

        const converted = convertToTimezoneDate(
            '2024-01-01T00:00:00.000Z',
            'America/New_York',
        )

        expect(converted.toISOString())
            .toBe('2023-12-31T19:00:00.000Z')
    })
})
