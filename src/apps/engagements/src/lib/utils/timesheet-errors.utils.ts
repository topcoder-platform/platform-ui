/** Entry fields the API validates and the grid can show an error against. */
export type TimesheetEntryField = 'hoursWorked' | 'remarks' | 'workDate'

export type TimesheetRowFieldErrors = Partial<Record<TimesheetEntryField, string>>

/** Field errors keyed by work date, which is how the grid identifies a row. */
export type TimesheetFieldErrors = Record<string, TimesheetRowFieldErrors>

export interface ParsedTimesheetSaveError {
    fieldErrors: TimesheetFieldErrors
    /** Whatever could not be placed on a row, or a pointer to the rows that were marked. */
    message?: string
}

const FIELD_LABELS: Record<TimesheetEntryField, string> = {
    hoursWorked: 'Hours worked',
    remarks: 'Remarks',
    workDate: 'Work date',
}

/** Matches the API's DTO validation messages, e.g. `entries.0.remarks must be shorter than ...`. */
const ENTRY_FIELD_MESSAGE = /^entries\.(\d+)\.(hoursWorked|remarks|workDate)\s+(.+)$/

const toMessages = (error: unknown): string[] => {
    const typedError = error as {
        message?: unknown
        response?: { data?: { message?: unknown } }
    }
    const raw = typedError?.response?.data?.message ?? typedError?.message
    const values = Array.isArray(raw) ? raw : [raw]

    return values.filter((value): value is string => typeof value === 'string' && !!value.trim())
}

/**
 * Turns a failed save into per-row field errors.
 *
 * The API reports DTO validation as `entries.<index>.<field> <message>`, where the index points into
 * the request payload - not into the grid, which also shows days that were never sent. Passing the
 * payload that was sent is what lets the index be mapped back to the row's work date.
 */
export const parseTimesheetSaveError = (
    error: unknown,
    entries: Array<{ workDate: string }>,
    fallback: string,
): ParsedTimesheetSaveError => {
    const fieldErrors: TimesheetFieldErrors = {}
    const unplaced: string[] = []

    toMessages(error)
        .forEach(message => {
            const match = ENTRY_FIELD_MESSAGE.exec(message.trim())
            const workDate = match ? entries[Number(match[1])]?.workDate : undefined

            if (!match || !workDate) {
                unplaced.push(message)
                return
            }

            const field = match[2] as TimesheetEntryField
            const rowErrors = fieldErrors[workDate] ?? {}

            // One message per field is enough; the API can report several rules for the same value.
            if (!rowErrors[field]) {
                rowErrors[field] = `${FIELD_LABELS[field]} ${match[3]}`
            }

            fieldErrors[workDate] = rowErrors
        })

    const hasFieldErrors = Object.keys(fieldErrors).length > 0
    let message: string | undefined = unplaced.join(' ') || undefined

    if (!message) {
        message = hasFieldErrors ? 'Fix the highlighted fields and try again.' : fallback
    }

    return { fieldErrors, message }
}

/** Drops the errors for the fields that just changed on one row. */
export const clearTimesheetFieldErrors = (
    fieldErrors: TimesheetFieldErrors,
    workDate: string,
    fields: string[],
): TimesheetFieldErrors => {
    const rowErrors = fieldErrors[workDate]

    if (!rowErrors || !fields.some(field => field in rowErrors)) {
        return fieldErrors
    }

    const remaining = { ...rowErrors }
    fields.forEach(field => {
        delete remaining[field as TimesheetEntryField]
    })

    const next = { ...fieldErrors }
    if (Object.keys(remaining).length) {
        next[workDate] = remaining
    } else {
        delete next[workDate]
    }

    return next
}

/** Shown under the remarks of a row that is about to be submitted without any. */
export const TIMESHEET_REMARKS_REQUIRED_MESSAGE = 'Remarks are required before submitting.'

/**
 * Marks the rows that cannot be submitted because their remarks are empty. Drafts may be saved
 * without remarks; the API refuses to submit them, so this catches it before the round trip.
 */
export const findMissingRemarksErrors = (
    rows: Array<{ remarks: string, workDate: string }>,
): TimesheetFieldErrors => Object.fromEntries(
    rows
        .filter(row => !row.remarks.trim())
        .map(row => [row.workDate, { remarks: TIMESHEET_REMARKS_REQUIRED_MESSAGE }]),
)
