import { ApprovedTimesheetRow } from '../models'

import {
    calculatePaymentAmount,
    getAssignmentRatePerHour,
} from './payment.utils'

function parseWorkDate(value: string): Date {
    const [year, month, day] = value.split('-')
        .map(Number)

    return new Date(year, month - 1, day)
}

function formatTitleDate(value: string): string {
    return parseWorkDate(value)
        .toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
}

/**
 * "Oct 5, 2026 - Oct 9, 2026", the date format the Assignees page payment title uses.
 */
export function formatApprovedTimesheetWorkPeriod(row: ApprovedTimesheetRow): string {
    return `${formatTitleDate(row.workPeriodStart)} - ${formatTitleDate(row.workPeriodEnd)}`
}

/**
 * The same "<project> - <engagement> - Work Period <from> - <to>" title the Assignees page builds,
 * so wallet admin shows these payments exactly like the ones created there.
 */
export function buildApprovedTimesheetPaymentTitle(row: ApprovedTimesheetRow): string {
    return [
        String(row.projectName || '')
            .trim(),
        String(row.engagementTitle || '')
            .trim(),
        `Work Period ${formatApprovedTimesheetWorkPeriod(row)}`,
    ]
        .filter(Boolean)
        .join(' - ')
}

export function getApprovedTimesheetRatePerHour(row: ApprovedTimesheetRow): number | undefined {
    return getAssignmentRatePerHour({
        agreementRate: row.agreementRate ?? undefined,
        paymentCycle: row.paymentCycle,
        ratePerHour: row.ratePerHour ?? undefined,
        standardHoursPerDay: row.standardHoursPerDay ?? undefined,
        standardHoursPerWeek: row.standardHoursPerWeek ?? undefined,
    })
}

export function getApprovedTimesheetPaymentAmount(row: ApprovedTimesheetRow): number | undefined {
    return calculatePaymentAmount(row.hours, getApprovedTimesheetRatePerHour(row))
}
