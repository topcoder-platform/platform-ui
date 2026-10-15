import {
    clearTimesheetFieldErrors,
    parseTimesheetSaveError,
} from './timesheet-errors.utils'

describe('timesheet error utils', () => {
    const entries = [{ workDate: '2026-09-02' }, { workDate: '2026-09-03' }]
    const validationError = (message: string | string[]): unknown => ({
        message: 'Request failed with status code 400',
        response: { data: { message } },
    })

    it('maps each entry index back to the work date that was sent', () => {
        const parsed = parseTimesheetSaveError(
            validationError([
                'entries.1.remarks must be shorter than or equal to 2000 characters',
                'entries.0.hoursWorked must be a number string',
            ]),
            entries,
            'Failed to save the timesheet.',
        )

        expect(parsed.fieldErrors)
            .toEqual({
                '2026-09-02': { hoursWorked: 'Hours worked must be a number string' },
                '2026-09-03': { remarks: 'Remarks must be shorter than or equal to 2000 characters' },
            })
        expect(parsed.message)
            .toBe('Fix the highlighted fields and try again.')
    })

    it('keeps only the first message for a field', () => {
        const parsed = parseTimesheetSaveError(
            validationError([
                'entries.0.remarks must be shorter than or equal to 2000 characters',
                'entries.0.remarks must be a string',
            ]),
            entries,
            'fallback',
        )

        expect(parsed.fieldErrors['2026-09-02'].remarks)
            .toBe('Remarks must be shorter than or equal to 2000 characters')
    })

    it('leaves messages it cannot place on a row in the banner', () => {
        const parsed = parseTimesheetSaveError(
            validationError([
                'entries.5.remarks must be a string',
                'overrideReason must be a string',
            ]),
            entries,
            'fallback',
        )

        expect(parsed.fieldErrors)
            .toEqual({})
        expect(parsed.message)
            .toBe('entries.5.remarks must be a string overrideReason must be a string')
    })

    it('passes a plain API message through unchanged', () => {
        const parsed = parseTimesheetSaveError(
            validationError('Approved timesheet entries cannot be changed.'),
            entries,
            'fallback',
        )

        expect(parsed.message)
            .toBe('Approved timesheet entries cannot be changed.')
    })

    it('falls back when the error carries no message', () => {
        expect(parseTimesheetSaveError({}, entries, 'Failed to save the timesheet.').message)
            .toBe('Failed to save the timesheet.')
    })

    it('clears only the edited fields of the edited row', () => {
        const errors = {
            '2026-09-02': { hoursWorked: 'Hours worked bad', remarks: 'Remarks bad' },
            '2026-09-03': { remarks: 'Remarks bad' },
        }

        expect(clearTimesheetFieldErrors(errors, '2026-09-02', ['remarks']))
            .toEqual({
                '2026-09-02': { hoursWorked: 'Hours worked bad' },
                '2026-09-03': { remarks: 'Remarks bad' },
            })
        expect(clearTimesheetFieldErrors(errors, '2026-09-03', ['remarks']))
            .toEqual({ '2026-09-02': errors['2026-09-02'] })
        expect(clearTimesheetFieldErrors(errors, '2026-09-03', ['hoursWorked']))
            .toBe(errors)
    })
})
