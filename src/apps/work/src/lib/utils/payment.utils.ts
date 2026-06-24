import {
    createElement,
    ReactNode,
} from 'react'

import { Assignment, AssignmentPayment } from '../models'

const DEFAULT_PAYMENT_CYCLE = 'WEEKLY'

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

function toOptionalDisplayString(value: unknown): string | undefined {
    if (value === null || value === undefined) {
        return undefined
    }

    const normalized = String(value)
        .trim()

    return normalized || undefined
}

type AssignmentPaymentDetail = NonNullable<AssignmentPayment['details']>[number]

function getFirstPaymentDetail(
    payment: AssignmentPayment,
): AssignmentPaymentDetail | undefined {
    return Array.isArray(payment.details) && payment.details.length > 0
        ? payment.details[0]
        : undefined
}

/**
 * Normalizes billing markup into a decimal multiplier for payment fee math.
 *
 * Stored markup can arrive as either a decimal fraction like `0.15` or a
 * whole percentage like `15`. Missing or invalid inputs return `undefined`.
 *
 * @param billingMarkup raw billing markup from project billing-account data.
 * @returns normalized decimal markup, or `undefined` when unavailable.
 */
function normalizeBillingMarkup(billingMarkup: unknown): number | undefined {
    const parsedMarkup = toNumber(billingMarkup)

    if (parsedMarkup === undefined) {
        return undefined
    }

    return parsedMarkup > 1
        ? parsedMarkup / 100
        : parsedMarkup
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

    if (payment.paymentAmount !== undefined) {
        return toNumber(payment.paymentAmount)
    }

    const firstDetail = getFirstPaymentDetail(payment)

    if (firstDetail) {
        const totalAmount = toNumber(firstDetail.totalAmount)

        if (totalAmount !== undefined) {
            return totalAmount
        }

        const grossAmount = toNumber(firstDetail.grossAmount)

        if (grossAmount !== undefined) {
            return grossAmount
        }

        return toNumber(firstDetail.amount)
    }

    return undefined
}

/**
 * Resolves the persisted challenge fee associated with a payment.
 *
 * Engagement payments store the manager-entered payment amount separately from
 * the billing-account fee. When finance or reports return the fee explicitly,
 * this helper uses that field. For older payloads it falls back to a positive
 * `totalAmount - grossAmount` delta when present.
 *
 * @param payment payment record returned by the finance API.
 * @returns challenge fee rounded to two decimals, or `undefined` when no fee
 * is available on the payment.
 */
export function getPaymentChallengeFee(
    payment: AssignmentPayment,
): number | undefined {
    const firstDetail = getFirstPaymentDetail(payment)
    const persistedChallengeFee = toNumber(payment.challengeFee ?? firstDetail?.challengeFee)

    if (persistedChallengeFee !== undefined && persistedChallengeFee >= 0) {
        return Number(persistedChallengeFee.toFixed(2))
    }

    const totalAmount = toNumber(firstDetail?.totalAmount)
    const grossAmount = toNumber(firstDetail?.grossAmount)

    if (
        totalAmount === undefined
        || grossAmount === undefined
        || totalAmount <= grossAmount
    ) {
        return undefined
    }

    return Number((totalAmount - grossAmount).toFixed(2))
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

/**
 * Resolves the billing account id stored on a payment detail.
 *
 * @param payment payment record returned by the finance API.
 * @returns billing account id from the first payment detail, or an empty
 * string when finance did not return one.
 *
 * @remarks Used by the payment history modal to show the BA ID charged for a
 * member payment.
 *
 * @throws This helper does not raise exceptions.
 */
export function getPaymentBillingAccountId(payment: AssignmentPayment): string {
    return toOptionalDisplayString(
        payment.billingAccountId ?? getFirstPaymentDetail(payment)?.billingAccount,
    ) || ''
}

/**
 * Resolves the hydrated billing account name stored on a payment detail.
 *
 * @param payment payment record returned by the finance API.
 * @returns billing account name from the first payment detail, or an empty
 * string when it has not been hydrated.
 *
 * @remarks Used by the payment history modal to show the BA name charged for a
 * member payment.
 *
 * @throws This helper does not raise exceptions.
 */
export function getPaymentBillingAccountName(payment: AssignmentPayment): string {
    return toOptionalDisplayString(getFirstPaymentDetail(payment)?.billingAccountName) || ''
}

export function getAssignmentStatus(member: Partial<Assignment>): string {
    if (!member.status) {
        return ''
    }

    return String(member.status)
}

export function getAssignmentPaymentCycle(member: Partial<Assignment>): string {
    const normalizedCycle = toOptionalDisplayString(member.paymentCycle)

    return normalizedCycle
        ? normalizedCycle.toUpperCase()
        : DEFAULT_PAYMENT_CYCLE
}

export function getAssignmentStandardHoursPerDay(
    member: Partial<Assignment>,
): number | string | undefined {
    if (
        member.standardHoursPerDay !== undefined
        && member.standardHoursPerDay !== null
        && member.standardHoursPerDay !== ''
    ) {
        return member.standardHoursPerDay
    }

    const standardHoursPerWeek = toNumber(member.standardHoursPerWeek)

    if (standardHoursPerWeek === undefined || standardHoursPerWeek <= 0) {
        return undefined
    }

    return Number((standardHoursPerWeek / 5).toFixed(2))
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
    if (
        member.standardHoursPerWeek !== undefined
        && member.standardHoursPerWeek !== null
        && member.standardHoursPerWeek !== ''
    ) {
        return member.standardHoursPerWeek
    }

    const standardHoursPerDay = toNumber(getAssignmentStandardHoursPerDay(member))

    if (standardHoursPerDay === undefined || standardHoursPerDay <= 0) {
        return undefined
    }

    return Number((standardHoursPerDay * 5).toFixed(2))
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

export function getExpectedHoursLabel(member: Partial<Assignment>): string {
    const standardHoursPerDay = toNumber(getAssignmentStandardHoursPerDay(member))

    if (standardHoursPerDay === undefined || standardHoursPerDay <= 0) {
        return ''
    }

    const paymentCycle = getAssignmentPaymentCycle(member)

    if (paymentCycle === 'FORTNIGHTLY') {
        return `${Number((standardHoursPerDay * 10).toFixed(2))} hours`
    }

    if (paymentCycle === 'MONTHLY') {
        const minimum = Number((standardHoursPerDay * 20).toFixed(2))
        const maximum = Number((standardHoursPerDay * 23).toFixed(2))

        return `${minimum}-${maximum} hours`
    }

    return `${Number((standardHoursPerDay * 5).toFixed(2))} hours`
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

/**
 * Calculates the billing-account fee preview for an engagement payment.
 *
 * @param amount manager-entered payment amount before fee.
 * @param billingMarkup raw billing-account markup from the project billing
 * details. Accepts decimal or whole-percentage values.
 * @returns calculated fee rounded to two decimals, or `undefined` when the
 * inputs are incomplete or invalid.
 */
export function calculatePaymentChallengeFee(
    amount: unknown,
    billingMarkup: unknown,
): number | undefined {
    const parsedAmount = toNumber(amount)
    const normalizedMarkup = normalizeBillingMarkup(billingMarkup)

    if (
        parsedAmount === undefined
        || parsedAmount < 0
        || normalizedMarkup === undefined
    ) {
        return undefined
    }

    return Number((parsedAmount * normalizedMarkup).toFixed(2))
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
