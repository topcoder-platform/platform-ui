import { PendingApprovalTimesheetApprover } from '../models'

/** Local calendar day as the YYYY-MM-DD the API filters work dates by. */
export function toWorkDateString(date: Date): string {
    const month = String(date.getMonth() + 1)
        .padStart(2, '0')
    const day = String(date.getDate())
        .padStart(2, '0')

    return `${date.getFullYear()}-${month}-${day}`
}

/** "Mary Jones (maryj)" when the manager's name is known, otherwise the handle alone. */
export function formatApprover(approver: PendingApprovalTimesheetApprover): string {
    const name = String(approver.name || '')
        .trim()

    return name ? `${name} (${approver.handle})` : approver.handle
}

/** Every approver of a row, or a note that the engagement has nobody to approve it. */
export function formatApprovers(approvers: PendingApprovalTimesheetApprover[]): string {
    return approvers.length
        ? approvers.map(formatApprover)
            .join(', ')
        : 'No manager assigned'
}

export function pluralize(count: number, singular: string, plural: string): string {
    return `${count} ${count === 1 ? singular : plural}`
}

/**
 * The previous working week, Monday through Friday - the period the member's own timesheet defaults
 * to, one week back.
 */
export function getPreviousWorkWeek(today: Date = new Date()): { fromDate: Date, toDate: Date } {
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const offsetToMonday = (monday.getDay() + 6) % 7
    monday.setDate(monday.getDate() - offsetToMonday - 7)

    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)

    return { fromDate: monday, toDate: friday }
}
