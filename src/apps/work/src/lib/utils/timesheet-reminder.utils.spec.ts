import {
    formatApprovers,
    getPreviousWorkWeek,
    pluralize,
    toWorkDateString,
} from './timesheet-reminder.utils'

describe('timesheet reminder utils', () => {
    it.each([
        ['a Monday', new Date(2026, 10, 16), '2026-11-09', '2026-11-13'],
        ['a Wednesday', new Date(2026, 10, 18), '2026-11-09', '2026-11-13'],
        ['a Sunday', new Date(2026, 10, 22), '2026-11-09', '2026-11-13'],
        ['across a month and year end', new Date(2026, 0, 5), '2025-12-29', '2026-01-02'],
    ])('picks the previous Monday to Friday on %s', (_label, today, fromDate, toDate) => {
        const week = getPreviousWorkWeek(today)

        expect(toWorkDateString(week.fromDate))
            .toBe(fromDate)
        expect(toWorkDateString(week.toDate))
            .toBe(toDate)
    })

    it('formats approvers with their names when known', () => {
        expect(formatApprovers([
            { handle: 'maryj', name: 'Mary Jones', userId: '2002' },
            { handle: 'petek', name: ' ', userId: '2003' },
        ]))
            .toBe('Mary Jones (maryj), petek')
        expect(formatApprovers([]))
            .toBe('No manager assigned')
    })

    it('pluralizes by count', () => {
        expect(pluralize(1, 'member', 'members'))
            .toBe('1 member')
        expect(pluralize(0, 'member', 'members'))
            .toBe('0 members')
    })
})
