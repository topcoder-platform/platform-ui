import { isValid, parseISO } from 'date-fns'

import type { ReportParameter } from '../../lib/services'

export const invalidReportDateMessage = 'Enter a valid ISO date such as 2024-01-31.'

/**
 * Validates report date inputs without allowing calendar rollover.
 *
 * `parseISO` rejects impossible dates, so values like 2026-02-29 and
 * 2026.04.31 fail validation instead of being sent to the API.
 *
 * @param value user-provided date input
 * @returns `true` when the value is a valid ISO-style date accepted by the reports UI
 */
export const isValidReportDateValue = (value: string): boolean => (
    isValid(parseISO(value.trim()))
)

/**
 * Returns the reports-page validation error for a parameter, if any.
 *
 * Empty values are treated as valid here because required-field checks run
 * separately in `ReportsPage` before download is enabled.
 *
 * @param parameter report parameter metadata from the reports directory
 * @param rawValue raw field value entered by the user
 * @returns an error message when the value is invalid; otherwise `undefined`
 */
export const getReportParameterValidationError = (
    parameter: Pick<ReportParameter, 'type'>,
    rawValue?: string,
): string | undefined => {
    const trimmedValue = rawValue?.trim()

    if (!trimmedValue) {
        return undefined
    }

    if (parameter.type === 'date' && !isValidReportDateValue(trimmedValue)) {
        return invalidReportDateMessage
    }

    return undefined
}
