import React from 'react'

import { EnvironmentConfig } from '~/config'

import {
    PaymentAgreementSummary,
    PaymentEngagementDetails,
    PaymentWorkLog,
    Winning,
} from '../../models/WinningDetail'

const WEEKLY_WORK_DAYS = 5

function parseRatePerHour(value?: string): number | undefined {
    if (!value) {
        return undefined
    }

    const parsedValue = Number(String(value)
        .replace(/[^0-9.-]/g, ''))

    return Number.isFinite(parsedValue) && parsedValue > 0
        ? parsedValue
        : undefined
}

export function buildWorkManagerAssignmentUrl(
    engagementDetails?: PaymentEngagementDetails,
): string | undefined {
    if (
        !engagementDetails?.assignmentId
        || !engagementDetails.engagementId
        || !engagementDetails.projectId
    ) {
        return undefined
    }

    const baseUrl = EnvironmentConfig.ADMIN.WORK_MANAGER_URL.replace(/\/$/, '')
    const assignmentPath = `${baseUrl}/projects/${engagementDetails.projectId}`
        + `/engagements/${engagementDetails.engagementId}/assignments`

    return `${assignmentPath}?assignmentId=${engagementDetails.assignmentId}`
}

/**
 * Builds the Work Manager project destination used by wallet-admin payment
 * details when engagement payments expose a linked project.
 *
 * @param engagementDetails Engagement metadata attached to the payment.
 * @returns The absolute project URL when a project id is available; otherwise
 * `undefined`.
 *
 * @remarks The payment details popup opens this URL in a new tab so admins can
 * jump directly from a payment to its owning project workspace.
 *
 * @throws This helper does not raise exceptions.
 */
export function buildWorkManagerProjectUrl(
    engagementDetails?: PaymentEngagementDetails,
): string | undefined {
    if (!engagementDetails?.projectId) {
        return undefined
    }

    const baseUrl = EnvironmentConfig.ADMIN.WORK_MANAGER_URL.replace(/\/$/, '')

    return `${baseUrl}/projects/${engagementDetails.projectId}`
}

export function formatOptionalText(
    value?: number | string | null,
): string {
    if (value === undefined || value === null || value === '') {
        return '-'
    }

    return String(value)
}

/**
 * Renders optional textarea content while converting plain-text URLs into
 * clickable external links for wallet-admin payment details.
 *
 * @param value Textarea content from engagement payment details or work-log
 * remarks.
 * @returns `-` when no content exists, otherwise the original text with any
 * detected `http://` or `https://` URLs rendered as anchor nodes.
 *
 * @remarks Used by the payment-details popup for engagement and work-log
 * remarks fields so admins can open referenced URLs directly.
 *
 * @throws This helper does not raise exceptions.
 */
export function renderOptionalLinkedText(
    value?: string | null,
): React.ReactNode {
    const text = formatOptionalText(value)

    if (text === '-') {
        return text
    }

    const urlPattern = /https?:\/\/[^\s<>"']+/gu
    const trailingPunctuationPattern = /[),.;!?]+$/u
    const nodes: React.ReactNode[] = []
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
            nodes.push(React.createElement('a', {
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

export function buildWorkAppChallengeUrl(
    projectId?: string,
    challengeId?: string,
): string | undefined {
    if (!projectId || !challengeId) {
        return undefined
    }

    const baseUrl = EnvironmentConfig.ADMIN.WORK_MANAGER_URL.replace(/\/$/, '')

    return `${baseUrl}/projects/${projectId}/challenges/${challengeId}/view`
}

export function formatOptionalDate(
    value?: string | null,
): string {
    if (!value) {
        return '-'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
    })
}

export function formatCurrencyAmount(
    amount: number,
    currency: string = 'USD',
): string {
    return amount.toLocaleString(undefined, {
        currency,
        style: 'currency',
    })
}

export function formatAuditTimestamp(value: string): string {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    const datePart = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
    const timePart = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    })

    return `${datePart}, ${timePart}`
}

export function getEngagementHoursPerDay(
    engagementDetails?: PaymentEngagementDetails,
): number | undefined {
    if (engagementDetails?.standardHoursPerDay !== undefined) {
        return engagementDetails.standardHoursPerDay
    }

    if (engagementDetails?.standardHoursPerWeek !== undefined) {
        return engagementDetails.standardHoursPerWeek / WEEKLY_WORK_DAYS
    }

    return undefined
}

export function getEngagementWorkDays(
    engagementDetails?: PaymentEngagementDetails,
): number {
    const cycle = engagementDetails?.paymentCycle?.trim()
        .toLowerCase()

    if (cycle === 'weekly') {
        return WEEKLY_WORK_DAYS
    }

    return WEEKLY_WORK_DAYS
}

export function buildEngagementAgreementSummary(
    payment: Winning,
    engagementDetails?: PaymentEngagementDetails,
    workLog?: PaymentWorkLog,
): PaymentAgreementSummary | undefined {
    const ratePerHour = parseRatePerHour(engagementDetails?.ratePerHour)

    if (!ratePerHour) {
        return undefined
    }

    const hoursWorked = workLog?.hoursWorked
    let workDays = getEngagementWorkDays(engagementDetails)
    let hoursPerDay = getEngagementHoursPerDay(engagementDetails)
    let expectedAmount: number | undefined

    if (hoursWorked !== undefined && hoursWorked > 0) {
        expectedAmount = Number((ratePerHour * hoursWorked).toFixed(2))
        workDays = 1
        hoursPerDay = hoursWorked
    } else if (hoursPerDay !== undefined && hoursPerDay > 0) {
        expectedAmount = Number((ratePerHour * workDays * hoursPerDay).toFixed(2))
    }

    if (expectedAmount === undefined || hoursPerDay === undefined) {
        return undefined
    }

    const actualAmount = payment.grossAmountNumber
    const difference = Number((actualAmount - expectedAmount).toFixed(2))
    const differenceAmount = Math.abs(difference)

    let status: PaymentAgreementSummary['status'] = 'match'

    if (difference > 0.01) {
        status = 'over'
    } else if (difference < -0.01) {
        status = 'under'
    }

    return {
        actualAmount,
        differenceAmount,
        expectedAmount,
        hoursPerDay,
        ratePerHour,
        status,
        workDays,
    }
}

export function formatAgreementBreakdown(
    summary: PaymentAgreementSummary,
): string {
    const rate = formatCurrencyAmount(summary.ratePerHour)

    if (summary.workDays === 1) {
        return `${rate} x ${summary.hoursPerDay} hours`
    }

    return `${rate} x ${summary.workDays} days x ${summary.hoursPerDay} hours`
}

export function formatPaymentCycle(
    engagementDetails?: PaymentEngagementDetails,
): string {
    const cycle = engagementDetails?.paymentCycle?.trim()

    if (!cycle) {
        return 'Weekly'
    }

    return cycle.charAt(0)
        .toUpperCase() + cycle.slice(1)
        .toLowerCase()
}

export function isContestPaymentType(type: string): boolean {
    return type.toLowerCase() === 'contest payment'
}

export function isCopilotPaymentType(type: string): boolean {
    return type.toLowerCase() === 'copilot payment'
}

export function isReviewBoardPaymentType(type: string): boolean {
    return type.toLowerCase() === 'review board payment'
}

/** Challenge payments: 4-column summary (Challenge Creator / Budget Approver) + General Info / Audit */
export function isChallengePaymentType(type: string): boolean {
    return isContestPaymentType(type)
        || isCopilotPaymentType(type)
        || isReviewBoardPaymentType(type)
}

export function isEngagementPaymentType(type: string): boolean {
    return type.toLowerCase() === 'engagement payment'
}

export function isTaskPaymentType(type: string): boolean {
    return type.toLowerCase() === 'task payment'
}

export function isTopgearPaymentType(type: string): boolean {
    return type.toLowerCase() === 'topgear payment'
}

export function isTaasPaymentType(type: string): boolean {
    return type.toLowerCase() === 'taas payment'
}

export function usesCompactPaymentSummary(type: string): boolean {
    return isTopgearPaymentType(type) || isTaasPaymentType(type)
}

/**
 * Task creator handle for task payments — always from `taskDetails.paymentCreatorHandle`.
 * Root-level `paymentCreatorHandle` is a client id and must not be shown.
 */
export function resolveTaskCreatorHandle(
    paymentDetails?: {
        taskDetails?: { paymentCreatorHandle?: string }
    },
): string | undefined {
    return paymentDetails?.taskDetails?.paymentCreatorHandle
}

/**
 * Payment approver handle from finance payment-details.
 * Engagement payments return it on `engagementDetails`; task payments on `taskDetails`.
 */
export function resolvePaymentApproverHandle(
    paymentDetails?: {
        engagementDetails?: { paymentApproverHandle?: string }
        taskDetails?: { paymentApproverHandle?: string }
    },
    challengePaymentApproverHandle?: string,
    isTaskPayment: boolean = false,
): string | undefined {
    if (isTaskPayment) {
        return paymentDetails?.taskDetails?.paymentApproverHandle
            ?? challengePaymentApproverHandle
    }

    return paymentDetails?.engagementDetails?.paymentApproverHandle
}

export interface PaymentDetailsSummaryConfig {
    approverLabel?: string
    columns: 2 | 4 | 5
    creatorLabel?: string
    secondaryApproverLabel?: string
}

export function getPaymentDetailsSummaryConfig(type: string): PaymentDetailsSummaryConfig {
    if (usesCompactPaymentSummary(type)) {
        return {
            columns: 2,
        }
    }

    if (isChallengePaymentType(type)) {
        return {
            approverLabel: 'Budget Approver',
            columns: 4,
            creatorLabel: 'Challenge Creator',
        }
    }

    if (isTaskPaymentType(type)) {
        return {
            approverLabel: 'Budget Approver',
            columns: 5,
            creatorLabel: 'Task Creator',
            secondaryApproverLabel: 'Payment Approver',
        }
    }

    if (isEngagementPaymentType(type)) {
        return {
            approverLabel: 'Payment Approver',
            columns: 4,
            creatorLabel: 'Payment Creator',
        }
    }

    return {
        approverLabel: 'Payment Approver',
        columns: 4,
        creatorLabel: 'Payment Creator',
    }
}

export function resolvePaymentAgreementSummary(
    payment: Winning,
    paymentDetails?: {
        agreementSummary?: PaymentAgreementSummary
        engagementDetails?: PaymentEngagementDetails
        workLog?: PaymentWorkLog
    },
): PaymentAgreementSummary | undefined {
    if (paymentDetails?.agreementSummary) {
        return paymentDetails.agreementSummary
    }

    return buildEngagementAgreementSummary(
        payment,
        paymentDetails?.engagementDetails,
        paymentDetails?.workLog,
    )
}

export function stripHtml(html: string, maxLength: number = 500): string {
    const div = document.createElement('div')
    div.innerHTML = html
    return (div.textContent ?? div.innerText ?? '').substring(0, maxLength)
}
