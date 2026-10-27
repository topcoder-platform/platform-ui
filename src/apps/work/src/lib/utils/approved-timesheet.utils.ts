import { ApprovedTimesheetRow } from '../models'

import {
    calculatePaymentAmount,
    getAssignmentRatePerHour,
    getAssignmentStandardHoursPerDay,
} from './payment.utils'

const DAY_IN_MS = 24 * 60 * 60 * 1000

export interface ApprovedTimesheetAssigneeSummary {
    /** Standard hours for the weekdays the selected periods cover; undefined when it cannot be derived. */
    agreedHours: number | undefined
    amount: number
    assigneeHandle: string
    assignmentId: string
    hours: number
}

export interface ApprovedTimesheetEngagementSummary {
    assignees: ApprovedTimesheetAssigneeSummary[]
    engagementId: string
    engagementTitle: string
    projectId: string
}

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

function toUtcDay(value: string): number {
    const [year, month, day] = value.split('-')
        .map(Number)

    return Date.UTC(year, month - 1, day)
}

/**
 * Standard hours per day times the distinct weekdays (Monday to Friday) the rows' work periods cover,
 * the same "expected hours" the timesheet payment summary reports. Overlapping periods count once.
 */
export function getApprovedTimesheetAgreedHours(rows: ApprovedTimesheetRow[]): number | undefined {
    const hoursPerDay = Number(getAssignmentStandardHoursPerDay({
        standardHoursPerDay: rows[0]?.standardHoursPerDay ?? undefined,
        standardHoursPerWeek: rows[0]?.standardHoursPerWeek ?? undefined,
    }))

    if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0) {
        return undefined
    }

    const weekdays = new Set<number>()

    rows.forEach(row => {
        const end = toUtcDay(row.workPeriodEnd)

        for (let day = toUtcDay(row.workPeriodStart); day <= end; day += DAY_IN_MS) {
            const dayOfWeek = new Date(day)
                .getUTCDay()

            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                weekdays.add(day)
            }
        }
    })

    return Math.round(hoursPerDay * weekdays.size * 100) / 100
}

/**
 * Rolls the selected rows up per engagement and, inside it, per assignee, keeping the order the rows
 * arrived in.
 */
export function summarizeApprovedTimesheetsByEngagement(
    rows: ApprovedTimesheetRow[],
): ApprovedTimesheetEngagementSummary[] {
    const engagements = new Map<string, Map<string, ApprovedTimesheetRow[]>>()

    rows.forEach(row => {
        const assignments = engagements.get(row.engagementId) ?? new Map<string, ApprovedTimesheetRow[]>()

        assignments.set(row.assignmentId, [...(assignments.get(row.assignmentId) ?? []), row])
        engagements.set(row.engagementId, assignments)
    })

    return Array.from(engagements.entries())
        .map(([engagementId, assignments]) => {
            const assignees = Array.from(assignments.entries())
                .map(([assignmentId, assignmentRows]) => {
                    // Summed in hundredths so float drift cannot leak into hours or money.
                    const totals = assignmentRows.reduce(
                        (sum, row) => ({
                            amountCents: sum.amountCents
                                + Math.round((getApprovedTimesheetPaymentAmount(row) ?? 0) * 100),
                            hoursHundredths: sum.hoursHundredths + Math.round(row.hours * 100),
                        }),
                        { amountCents: 0, hoursHundredths: 0 },
                    )

                    return {
                        agreedHours: getApprovedTimesheetAgreedHours(assignmentRows),
                        amount: totals.amountCents / 100,
                        assigneeHandle: assignmentRows[0].assigneeHandle,
                        assignmentId,
                        hours: totals.hoursHundredths / 100,
                    }
                })
            const firstRow = assignments.values()
                .next().value as ApprovedTimesheetRow[]

            return {
                assignees,
                engagementId,
                engagementTitle: firstRow[0].engagementTitle,
                projectId: firstRow[0].projectId,
            }
        })
}
