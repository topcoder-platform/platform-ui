import {
    getReportParameterValidationError,
    invalidReportDateMessage,
    isValidReportDateValue,
} from './reports-page.validation'

describe('reports page date validation', () => {
    it('accepts a real calendar date', () => {
        expect(isValidReportDateValue('2026-02-28'))
            .toBe(true)
    })

    it('rejects impossible dates for shorter months', () => {
        expect(isValidReportDateValue('2026-02-29'))
            .toBe(false)
        expect(isValidReportDateValue('2026-04-31'))
            .toBe(false)
    })

    it('rejects dotted invalid dates entered into the reports fields', () => {
        expect(isValidReportDateValue('2026.02.29'))
            .toBe(false)
        expect(isValidReportDateValue('2026.04.31'))
            .toBe(false)
    })

    it('returns the shared validation message for invalid date parameters', () => {
        expect(getReportParameterValidationError({ type: 'date' }, '2026-02-29'))
            .toBe(invalidReportDateMessage)
    })

    it('does not flag empty or non-date parameters', () => {
        expect(getReportParameterValidationError({ type: 'date' }, ''))
            .toBeUndefined()
        expect(getReportParameterValidationError({ type: 'string' }, '2026-02-29'))
            .toBeUndefined()
    })
})
