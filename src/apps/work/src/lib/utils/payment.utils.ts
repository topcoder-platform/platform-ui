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

export function getAssignmentStatus(member: Partial<Assignment>): string {
    if (!member.status) {
        return ''
    }

    return String(member.status)
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
