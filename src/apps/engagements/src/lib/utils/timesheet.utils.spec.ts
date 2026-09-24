/* eslint-disable unicorn/no-null, sort-keys -- the entry fixture mirrors the API payload, which
   uses null for absent values and is not alphabetised */
import { TimesheetEntryStatus } from '../models'
import type { TimesheetEntry } from '../models'

import {
    buildRowsFromEntries,
    buildTimesheetRows,
    countRangeDays,
    formatDisplayDate,
    formatHoursLabel,
    generateWorkDates,
    getDayLabel,
    hasEnteredHours,
    isRowReadOnly,
    isRowReopened,
    sumSelectedTotals,
    validateDateRange,
    validateHours,
} from './timesheet.utils'
import type { TimesheetRow } from './timesheet.utils'

const entry = (overrides: Partial<TimesheetEntry> = {}): TimesheetEntry => ({
    approvalComment: null,
    approvedAt: null,
    approvedByHandle: null,
    hoursWorked: '8.50',
    id: 'entry-1',
    isPaid: false,
    outsideAssignmentWindow: false,
    remarks: 'Sprint planning',
    reopenedAt: null,
    status: TimesheetEntryStatus.DRAFT,
    submittedAt: null,
    workDate: '2026-09-07',
    ...overrides,
})

const row = (overrides: Partial<TimesheetRow> = {}): TimesheetRow => ({
    dayLabel: 'Monday',
    displayDate: '07-09-2026',
    hoursWorked: '8.5',
    isPaid: false,
    outsideAssignmentWindow: false,
    remarks: '',
    status: TimesheetEntryStatus.DRAFT,
    workDate: '2026-09-07',
    ...overrides,
})

describe('timesheet.utils', () => {
    describe('generateWorkDates', () => {
        it('includes both ends of the range', () => {
            expect(generateWorkDates('2026-09-07', '2026-09-11'))
                .toEqual([
                    '2026-09-07',
                    '2026-09-08',
                    '2026-09-09',
                    '2026-09-10',
                    '2026-09-11',
                ])
        })

        it('returns a single date for a one-day range', () => {
            expect(generateWorkDates('2026-09-07', '2026-09-07'))
                .toEqual(['2026-09-07'])
        })

        it('crosses a month boundary', () => {
            expect(generateWorkDates('2026-08-30', '2026-09-02'))
                .toEqual([
                    '2026-08-30',
                    '2026-08-31',
                    '2026-09-01',
                    '2026-09-02',
                ])
        })

        it('crosses a year boundary', () => {
            expect(generateWorkDates('2026-12-30', '2027-01-02'))
                .toEqual([
                    '2026-12-30',
                    '2026-12-31',
                    '2027-01-01',
                    '2027-01-02',
                ])
        })

        it('covers a leap day', () => {
            expect(generateWorkDates('2028-02-28', '2028-03-01'))
                .toEqual([
                    '2028-02-28',
                    '2028-02-29',
                    '2028-03-01',
                ])
        })

        it('returns nothing when the range is inverted', () => {
            expect(generateWorkDates('2026-09-11', '2026-09-07'))
                .toEqual([])
        })

        it('returns nothing for malformed dates', () => {
            expect(generateWorkDates('07-09-2026', '2026-09-11'))
                .toEqual([])
        })
    })

    describe('countRangeDays', () => {
        it.each([
            ['2026-09-07', '2026-09-11', 5],
            ['2026-09-07', '2026-09-07', 1],
            ['2026-09-01', '2026-10-01', 31],
            ['2026-09-01', '2026-10-02', 32],
            ['2026-09-11', '2026-09-07', 0],
        ])('counts %s to %s as %i days', (fromDate, toDate, expected) => {
            expect(countRangeDays(fromDate, toDate))
                .toBe(expected)
        })
    })

    describe('validateDateRange', () => {
        it('accepts a range within the cap', () => {
            expect(validateDateRange('2026-09-07', '2026-09-11'))
                .toBeUndefined()
        })

        it('accepts exactly 31 days', () => {
            expect(validateDateRange('2026-09-01', '2026-10-01'))
                .toBeUndefined()
        })

        it('blocks an inverted range', () => {
            expect(validateDateRange('2026-09-11', '2026-09-07'))
                .toBe('The to date cannot be earlier than the from date.')
        })

        it('blocks a range over 31 days', () => {
            expect(validateDateRange('2026-09-01', '2026-10-02'))
                .toBe('A timesheet range cannot span more than 31 days.')
        })

        it('says nothing until both dates are picked', () => {
            expect(validateDateRange('2026-09-07', undefined))
                .toBeUndefined()
        })
    })

    describe('date formatting', () => {
        it('formats DD-MM-YYYY for display', () => {
            expect(formatDisplayDate('2026-09-07'))
                .toBe('07-09-2026')
        })

        it('names the day of the week', () => {
            expect(getDayLabel('2026-09-07'))
                .toBe('Monday')
            expect(getDayLabel('2026-09-12'))
                .toBe('Saturday')
        })

        it('does not shift the date across timezones', () => {
            // Parsed as UTC rather than local time, so an early-morning date stays on its own day.
            expect(formatDisplayDate('2026-01-01'))
                .toBe('01-01-2026')
            expect(getDayLabel('2026-01-01'))
                .toBe('Thursday')
        })
    })

    describe('buildTimesheetRows', () => {
        it('merges saved entries into the generated rows', () => {
            const rows = buildTimesheetRows('2026-09-07', '2026-09-09', [
                entry({ workDate: '2026-09-08', hoursWorked: '7.25', remarks: 'Review' }),
            ])

            expect(rows)
                .toHaveLength(3)
            expect(rows[0])
                .toEqual(expect.objectContaining({ hoursWorked: '', id: undefined }))
            expect(rows[1])
                .toEqual(expect.objectContaining({
                    hoursWorked: '7.25',
                    id: 'entry-1',
                    remarks: 'Review',
                }))
            expect(rows[2].hoursWorked)
                .toBe('')
        })

        it('does not duplicate a saved entry', () => {
            const rows = buildTimesheetRows('2026-09-07', '2026-09-07', [entry()])

            expect(rows)
                .toHaveLength(1)
            expect(rows[0].id)
                .toBe('entry-1')
        })

        it('leaves out saved entries outside the picked range', () => {
            const rows = buildTimesheetRows('2026-09-07', '2026-09-08', [
                entry({ workDate: '2026-09-20' }),
            ])

            expect(rows.map(generated => generated.workDate))
                .toEqual([
                    '2026-09-07',
                    '2026-09-08',
                ])
            expect(rows.every(generated => generated.id === undefined))
                .toBe(true)
        })

        it('carries approval details through', () => {
            const rows = buildTimesheetRows('2026-09-07', '2026-09-07', [
                entry({
                    approvalComment: 'Approved for week 37',
                    approvedAt: '2026-09-12T10:04:11.000Z',
                    approvedByHandle: 'maryj',
                    status: TimesheetEntryStatus.APPROVED,
                }),
            ])

            expect(rows[0])
                .toEqual(expect.objectContaining({
                    approvalComment: 'Approved for week 37',
                    approvedByHandle: 'maryj',
                    status: TimesheetEntryStatus.APPROVED,
                }))
        })
    })

    describe('buildRowsFromEntries', () => {
        it('sorts by work date', () => {
            const rows = buildRowsFromEntries([
                entry({ id: 'b', workDate: '2026-09-09' }),
                entry({ id: 'a', workDate: '2026-09-07' }),
            ])

            expect(rows.map(generated => generated.id))
                .toEqual(['a', 'b'])
        })
    })

    describe('validateHours', () => {
        it.each(['8', '8.5', '9.5', '0.25'])('accepts %s', value => {
            expect(validateHours(value))
                .toEqual({})
        })

        it('rejects negatives', () => {
            expect(validateHours('-1').error)
                .toBe('Hours cannot be negative.')
        })

        it('rejects non-numeric input', () => {
            expect(validateHours('abc').error)
                .toBe('Hours must be a number.')
        })

        it('blocks more than 24 hours in a day', () => {
            expect(validateHours('24.01').error)
                .toBe('Hours cannot exceed 24 for a single day.')
            expect(validateHours('24').error)
                .toBeUndefined()
        })

        it('warns without blocking above the standard hours per day', () => {
            const result = validateHours('10', 8)

            expect(result.error)
                .toBeUndefined()
            expect(result.warning)
                .toBe('Above the standard 8 hours for this engagement.')
        })

        it('says nothing about an empty value', () => {
            expect(validateHours('   '))
                .toEqual({})
        })
    })

    describe('sumSelectedTotals', () => {
        it('counts days and sums hours exactly', () => {
            expect(sumSelectedTotals([
                row({ hoursWorked: '8.5' }),
                row({ hoursWorked: '8.5' }),
                row({ hoursWorked: '8.5' }),
            ]))
                .toEqual({ days: 3, hours: '25.50' })
        })

        it('does not drift on values a float would round badly', () => {
            expect(sumSelectedTotals([
                row({ hoursWorked: '0.1' }),
                row({ hoursWorked: '0.2' }),
            ]).hours)
                .toBe('0.30')
        })

        it('treats blank hours as zero', () => {
            expect(sumSelectedTotals([row({ hoursWorked: '' })]))
                .toEqual({
                    days: 1,
                    hours: '0.00',
                })
        })

        it('is zero for an empty selection', () => {
            expect(sumSelectedTotals([]))
                .toEqual({ days: 0, hours: '0.00' })
        })
    })

    describe('row helpers', () => {
        it('treats approved rows as read-only', () => {
            expect(isRowReadOnly(row({ status: TimesheetEntryStatus.APPROVED })))
                .toBe(true)
            expect(isRowReadOnly(row({ status: TimesheetEntryStatus.SUBMITTED })))
                .toBe(false)
        })

        it('identifies a reopened row, which is a draft that was once approved', () => {
            expect(isRowReopened(row({ reopenedAt: '2026-09-14T00:00:00.000Z' })))
                .toBe(true)
            expect(isRowReopened(row()))
                .toBe(false)
            expect(isRowReopened(row({
                reopenedAt: '2026-09-14T00:00:00.000Z',
                status: TimesheetEntryStatus.APPROVED,
            })))
                .toBe(false)
        })

        it('knows which rows hold hours worth saving', () => {
            expect(hasEnteredHours(row({ hoursWorked: '8' })))
                .toBe(true)
            expect(hasEnteredHours(row({ hoursWorked: '0' })))
                .toBe(false)
            expect(hasEnteredHours(row({ hoursWorked: '' })))
                .toBe(false)
        })
    })

    describe('formatHoursLabel', () => {
        it('drops a trailing .00 so 42.50 reads as 42.5', () => {
            expect(formatHoursLabel('42.50'))
                .toBe('42.5')
            expect(formatHoursLabel('8.00'))
                .toBe('8')
        })
    })
})
