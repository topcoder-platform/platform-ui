import {
    createElement,
    ReactNode,
} from 'react'

import { Assignment, AssignmentPayment } from '../models'

const currencyFormatter = new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
})

function toNumber(value: unknown): number | undefined {
    const parsed = Number(value)

    if (!Number.isFinite(parsed)) {
        return undefined
    }

    return parsed
}

function toOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const normalized = value.trim()

    return normalized || undefined
}

export function formatCurrency(value: unknown): string {
    const parsed = toNumber(value)

    if (parsed === undefined) {
        return '-'
    }

    return currencyFormatter.format(parsed)
}

export function getPaymentAmount(payment: AssignmentPayment): number | undefined {
    if (payment.amount !== undefined) {
        return toNumber(payment.amount)
    }

    if (Array.isArray(payment.details) && payment.details.length > 0) {
        const firstDetail = payment.details[0]

        return toNumber(firstDetail.totalAmount)
            || toNumber(firstDetail.grossAmount)
            || toNumber(firstDetail.amount)
    }

    return undefined
}

export function getPaymentStatus(payment: AssignmentPayment): string {
    if (!payment.status) {
        return 'Unknown'
    }

    return String(payment.status)
}

/**
 * Resolves the optional hours-worked value returned for a payment.
 *
 * @param payment payment record returned by the finance API.
 * @returns formatted hours-worked value, or an empty string when the field is unavailable.
 */
export function getPaymentHoursWorked(payment: AssignmentPayment): string {
    const paymentDetails = Array.isArray(payment.details) && payment.details.length > 0
        ? payment.details[0]
        : undefined
    const value = payment.hoursWorked
        ?? payment.attributes?.hoursWorked
        ?? paymentDetails?.hoursWorked

    if (value === null || value === undefined || value === '') {
        return ''
    }

    const parsedValue = Number(value)

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        return ''
    }

    return Number(parsedValue.toFixed(2))
        .toString()
}

export function getAssignmentStatus(member: Partial<Assignment>): string {
    if (!member.status) {
        return ''
    }

    return String(member.status)
}

/**
 * Reads the assignment standard hours value from a member object.
 *
 * @param member selected assignment/member record.
 * @returns standard hours per week, when available.
 */
export function getAssignmentStandardHoursPerWeek(
    member: Partial<Assignment>,
): number | string | undefined {
    return member.standardHoursPerWeek
}

/**
 * Resolves the hourly assignment rate for payment calculation.
 *
 * @param member selected assignment/member record.
 * @returns hourly pay rate, or `undefined` when it cannot be derived.
 */
export function getAssignmentRatePerHour(
    member: Partial<Assignment>,
): number | undefined {
    const directRate = toNumber(member.ratePerHour)

    if (directRate !== undefined && directRate > 0) {
        return directRate
    }

    const standardHoursPerWeek = toNumber(getAssignmentStandardHoursPerWeek(member))
    const agreementRate = toNumber(member.agreementRate)

    if (
        standardHoursPerWeek === undefined
        || standardHoursPerWeek <= 0
        || agreementRate === undefined
        || agreementRate <= 0
    ) {
        return undefined
    }

    return agreementRate / standardHoursPerWeek
}

/**
 * Calculates the payment amount from hours worked and hourly pay rate.
 *
 * @param hoursWorked worked hours for the payment week.
 * @param ratePerHour assignment hourly pay rate.
 * @returns calculated amount with two decimal places, or `undefined` when the inputs are incomplete or invalid.
 */
export function calculatePaymentAmount(
    hoursWorked: unknown,
    ratePerHour: unknown,
): number | undefined {
    const parsedHoursWorked = toNumber(hoursWorked)
    const parsedRatePerHour = toNumber(ratePerHour)

    if (
        parsedHoursWorked === undefined
        || parsedHoursWorked <= 0
        || parsedRatePerHour === undefined
        || parsedRatePerHour <= 0
    ) {
        return undefined
    }

    return Number((parsedHoursWorked * parsedRatePerHour).toFixed(2))
}

export function getPaymentRemarks(payment: AssignmentPayment): string {
    return toOptionalString(payment.attributes?.remarks) || ''
}

/**
 * Resolves the display value for the payment creator field.
 *
 * @param payment payment record returned by the finance API.
 * @returns creator handle when it was resolved, otherwise the raw creator
 * identifier, or an empty string when unavailable.
 */
export function getPaymentCreatorLabel(payment: AssignmentPayment): string {
    return toOptionalString(payment.createdByHandle)
        || toOptionalString(payment.createdBy)
        || ''
}

/**
 * Renders payment remarks while converting embedded URLs into external links.
 *
 * @param value payment remarks text from the finance API.
 * @returns an empty string when no remarks exist, otherwise text and anchor
 * nodes with plain `http://` or `https://` URLs opened in a new tab.
 *
 * @remarks Used by the work-app payment history modal so managers can open
 * ticket, spreadsheet, or document links directly from remarks.
 *
 * @throws This helper does not raise exceptions.
 */
export function renderPaymentLinkedText(value?: string): ReactNode {
    const text = toOptionalString(value)

    if (!text) {
        return ''
    }

    const urlPattern = /https?:\/\/[^\s<>"']+/gu
    const trailingPunctuationPattern = /[),.;!?]+$/u
    const nodes: ReactNode[] = []
    let currentIndex = 0

    let match = urlPattern.exec(text)

    while (match) {
        const [matchedText] = match
        const matchIndex = match.index ?? 0
        const url = matchedText.replace(trailingPunctuationPattern, '')
        const trailingText = matchedText.slice(url.length)

        if (matchIndex > currentIndex) {
            nodes.push(text.slice(currentIndex, matchIndex))
        }

        if (url) {
            nodes.push(createElement('a', {
                href: url,
                key: `${url}-${matchIndex}`,
                rel: 'noreferrer',
                target: '_blank',
            }, url))
        }

        if (trailingText) {
            nodes.push(trailingText)
        }

        currentIndex = matchIndex + matchedText.length
        match = urlPattern.exec(text)
    }

    if (nodes.length === 0) {
        return text
    }

    if (currentIndex < text.length) {
        nodes.push(text.slice(currentIndex))
    }

    return nodes
}

export function normalizeAssignmentStatus(status: string): string {
    if (!status) {
        return ''
    }

    const normalized = status
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[\s_-]+/g, ' ')
        .trim()

    if (!normalized) {
        return ''
    }

    return normalized
        .split(' ')
        .map(token => token[0].toUpperCase() + token.slice(1)
            .toLowerCase())
        .join(' ')
}
