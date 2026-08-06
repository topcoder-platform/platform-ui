import {
    formatAssignmentDaysLeftInEngagement,
    getAssignmentDaysLeftInEngagement,
} from './assignment-dates.utils'

describe('assignment-dates.utils', () => {
    describe('getAssignmentDaysLeftInEngagement', () => {
        it('returns remaining whole days from billing start plus duration months', () => {
            const daysLeft = getAssignmentDaysLeftInEngagement(
                '2026-01-01T12:00:00.000Z',
                1,
                new Date('2026-01-16T12:00:00.000Z'),
            )

            expect(daysLeft)
                .toBe(16)
        })

        it('returns 0 when the engagement has already ended', () => {
            const daysLeft = getAssignmentDaysLeftInEngagement(
                '2026-01-01T12:00:00.000Z',
                1,
                new Date('2026-03-01T12:00:00.000Z'),
            )

            expect(daysLeft)
                .toBe(0)
        })

        it('returns undefined when start date or duration is missing', () => {
            expect(getAssignmentDaysLeftInEngagement(undefined, 3))
                .toBeUndefined()
            expect(getAssignmentDaysLeftInEngagement('2026-01-01T12:00:00.000Z', undefined))
                .toBeUndefined()
        })
    })

    describe('formatAssignmentDaysLeftInEngagement', () => {
        it('formats remaining days for display', () => {
            expect(formatAssignmentDaysLeftInEngagement(
                '2026-01-01T12:00:00.000Z',
                1,
                undefined,
                new Date('2026-01-31T12:00:00.000Z'),
            ))
                .toBe('1 day')

            expect(formatAssignmentDaysLeftInEngagement(
                '2026-01-01T12:00:00.000Z',
                1,
                'ASSIGNED',
                new Date('2026-01-16T12:00:00.000Z'),
            ))
                .toBe('16 days')

            expect(formatAssignmentDaysLeftInEngagement(undefined, 3))
                .toBe('-')
        })

        it('returns N/A for cancelled or closed engagements', () => {
            expect(formatAssignmentDaysLeftInEngagement(
                '2026-01-01T12:00:00.000Z',
                1,
                'CANCELLED',
                new Date('2026-01-16T12:00:00.000Z'),
            ))
                .toBe('N/A')

            expect(formatAssignmentDaysLeftInEngagement(
                '2026-01-01T12:00:00.000Z',
                1,
                'Closed',
                new Date('2026-01-16T12:00:00.000Z'),
            ))
                .toBe('N/A')

            expect(formatAssignmentDaysLeftInEngagement(
                '2026-01-01T12:00:00.000Z',
                1,
                'Active',
                new Date('2026-01-16T12:00:00.000Z'),
            ))
                .toBe('16 days')
        })
    })
})
