import { TIMESHEET_MAX_HOURS_PER_DAY, TIMESHEET_MAX_RANGE_DAYS } from '../../config/constants'
import type { TimesheetEntry } from '../models'
import { TimesheetEntryStatus } from '../models'

const DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
]

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DECIMAL_PATTERN = /^\d*(\.\d*)?$/

/**
 * One row of the timesheet grid.
 *
 * Rows for a picked date range are generated here, in the browser, and only the ones the member fills
 * in are ever sent to the server. A row without an `id` has no database row behind it yet: browsing a
 * month must not create thirty empty drafts that would then clutter the administrator's list and make
 * "Total Days" ambiguous.
 */
export interface TimesheetRow {
    // The API returns null for absent values; the row view model uses undefined, which is what this
    // app's lint rules want and what React treats as nothing to render.
    approvalComment?: string
    approvedAt?: string
    approvedByHandle?: string
    /** Day of week, e.g. `Monday`. */
    dayLabel: string
    /** `DD-MM-YYYY`, for display only. */
    displayDate: string
    hoursWorked: string
    /** Absent until the row has been saved. */
    id?: string
    isPaid: boolean
    paidAt?: string
    paymentReference?: string
    outsideAssignmentWindow: boolean
    remarks: string
    reopenedAt?: string
    status: TimesheetEntryStatus
    /** `YYYY-MM-DD`, which is what every API payload uses. */
    workDate: string
}

/**
 * Parses `YYYY-MM-DD` as a UTC calendar day.
 *
 * Everything here works in UTC on purpose. A timesheet date is a calendar day, not an instant, so
 * parsing in local time is what makes the 7th render as the 6th for anyone west of Greenwich.
 */
export const parseWorkDate = (value: string): Date | undefined => {
    if (!ISO_DATE_PATTERN.test(value)) {
        return undefined
    }

    const [year, month, day] = value.split('-')
        .map(Number)
    const parsed = new Date(Date.UTC(year, month - 1, day))

    return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

/** Formats a `Date` as the `YYYY-MM-DD` the API speaks. */
export const toWorkDateString = (date: Date): string => (
    new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
        .toISOString()
        .slice(0, 10)
)

/** Formats `YYYY-MM-DD` as the `DD-MM-YYYY` the grid displays. */
export const formatDisplayDate = (workDate: string): string => {
    const parsed = parseWorkDate(workDate)
    if (!parsed) {
        return workDate
    }

    const day = String(parsed.getUTCDate())
        .padStart(2, '0')
    const month = String(parsed.getUTCMonth() + 1)
        .padStart(2, '0')

    return `${day}-${month}-${parsed.getUTCFullYear()}`
}

/** Day of the week for a `YYYY-MM-DD` date, e.g. `Monday`. */
export const getDayLabel = (workDate: string): string => {
    const parsed = parseWorkDate(workDate)
    return parsed ? DAY_NAMES[parsed.getUTCDay()] : ''
}

/**
 * Every calendar date from `fromDate` to `toDate`, **inclusive of both ends**.
 *
 * 7 September to 11 September yields five dates: the 7th, 8th, 9th, 10th, and 11th.
 */
export const generateWorkDates = (fromDate: string, toDate: string): string[] => {
    const start = parseWorkDate(fromDate)
    const end = parseWorkDate(toDate)

    if (!start || !end || end.getTime() < start.getTime()) {
        return []
    }

    const dates: string[] = []
    const cursor = new Date(start.getTime())

    while (cursor.getTime() <= end.getTime()) {
        dates.push(cursor.toISOString()
            .slice(0, 10))
        cursor.setUTCDate(cursor.getUTCDate() + 1)
    }

    return dates
}

/** Number of days a range covers, counting both ends. Zero when the range is invalid. */
export const countRangeDays = (fromDate: string, toDate: string): number => {
    const start = parseWorkDate(fromDate)
    const end = parseWorkDate(toDate)

    if (!start || !end || end.getTime() < start.getTime()) {
        return 0
    }

    return Math.round((end.getTime() - start.getTime()) / 86400000) + 1
}

/**
 * Validates a picked range.
 *
 * @returns An error message to show the member, or undefined when the range is usable.
 */
export const validateDateRange = (fromDate?: string, toDate?: string): string | undefined => {
    if (!fromDate || !toDate) {
        return undefined
    }

    const start = parseWorkDate(fromDate)
    const end = parseWorkDate(toDate)

    if (!start || !end) {
        return 'Enter valid from and to dates.'
    }

    if (end.getTime() < start.getTime()) {
        return 'The to date cannot be earlier than the from date.'
    }

    if (countRangeDays(fromDate, toDate) > TIMESHEET_MAX_RANGE_DAYS) {
        return `A timesheet range cannot span more than ${TIMESHEET_MAX_RANGE_DAYS} days.`
    }

    return undefined
}

/** True when an entry is frozen for the member: approved entries need an administrator to change. */
export const isRowReadOnly = (row: TimesheetRow): boolean => (
    row.status === TimesheetEntryStatus.APPROVED
)

/** A reopened row comes back as a draft; this is what distinguishes it from one never submitted. */
export const isRowReopened = (row: TimesheetRow): boolean => (
    Boolean(row.reopenedAt) && row.status === TimesheetEntryStatus.DRAFT
)

const toRow = (workDate: string, entry?: TimesheetEntry): TimesheetRow => ({
    approvalComment: entry?.approvalComment ?? undefined,
    approvedAt: entry?.approvedAt ?? undefined,
    approvedByHandle: entry?.approvedByHandle ?? undefined,
    dayLabel: getDayLabel(workDate),
    displayDate: formatDisplayDate(workDate),
    hoursWorked: entry?.hoursWorked ?? '',
    id: entry?.id,
    isPaid: entry?.isPaid ?? false,
    paidAt: entry?.paidAt ?? undefined,
    paymentReference: entry?.paymentReference ?? undefined,
    outsideAssignmentWindow: entry?.outsideAssignmentWindow ?? false,
    remarks: entry?.remarks ?? '',
    reopenedAt: entry?.reopenedAt ?? undefined,
    status: entry?.status ?? TimesheetEntryStatus.DRAFT,
    workDate,
})

/**
 * Builds the grid rows for a picked range, merging in whatever is already saved.
 *
 * A saved entry inside the range shows its own hours, remarks, and status rather than a blank duplicate;
 * saved entries outside the range are left out, because the member asked to see this range.
 */
export const buildTimesheetRows = (
    fromDate: string,
    toDate: string,
    entries: TimesheetEntry[],
): TimesheetRow[] => {
    const entryByDate = new Map(entries.map(entry => [entry.workDate, entry]))

    return generateWorkDates(fromDate, toDate)
        .map(workDate => toRow(workDate, entryByDate.get(workDate)))
}

/** Rows for saved entries only, for the views that list what exists rather than a picked range. */
export const buildRowsFromEntries = (entries: TimesheetEntry[]): TimesheetRow[] => (
    [...entries]
        .sort((left, right) => left.workDate.localeCompare(right.workDate))
        .map(entry => toRow(entry.workDate, entry))
)

/**
 * Validates an hours value as the member types.
 *
 * @returns `error` blocks saving; `warning` is advisory - above the assignment's standard hours is
 * normal enough (overtime) that blocking it would be wrong, but worth flagging.
 */
export const validateHours = (
    value: string,
    standardHoursPerDay?: number | null,
): { error?: string, warning?: string } => {
    const trimmed = value.trim()

    if (!trimmed) {
        return {}
    }

    if (trimmed.startsWith('-')) {
        return { error: 'Hours cannot be negative.' }
    }

    if (!DECIMAL_PATTERN.test(trimmed) || Number.isNaN(Number(trimmed))) {
        return { error: 'Hours must be a number.' }
    }

    const hours = Number(trimmed)

    if (hours > TIMESHEET_MAX_HOURS_PER_DAY) {
        return { error: `Hours cannot exceed ${TIMESHEET_MAX_HOURS_PER_DAY} for a single day.` }
    }

    if (standardHoursPerDay && hours > standardHoursPerDay) {
        return { warning: `Above the standard ${standardHoursPerDay} hours for this engagement.` }
    }

    return {}
}

/** True when the row holds hours that could be saved. */
export const hasEnteredHours = (row: TimesheetRow): boolean => {
    const trimmed = row.hoursWorked.trim()
    return Boolean(trimmed) && Number(trimmed) > 0
}

/**
 * Totals for the selected rows, shown above the submit action.
 *
 * Hours are summed in cents-like integers rather than floats: `8.5 + 8.5 + 8.5` in binary floating
 * point is not `25.5`, and this total is what the member sees next to a submit button.
 */
export const sumSelectedTotals = (rows: TimesheetRow[]): { days: number, hours: string } => {
    const hundredths = rows.reduce((total, row) => {
        const value = Number(row.hoursWorked)
        return total + (Number.isFinite(value) ? Math.round(value * 100) : 0)
    }, 0)

    return {
        days: rows.length,
        hours: (hundredths / 100).toFixed(2),
    }
}

/** Formats an hours total for display, dropping a trailing `.00` so `42.50` reads as `42.5`. */
export const formatHoursLabel = (hours: string): string => {
    const value = Number(hours)
    return Number.isFinite(value) ? String(value) : hours
}
