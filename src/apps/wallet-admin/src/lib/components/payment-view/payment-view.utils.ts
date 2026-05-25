import React from 'react'

import { EnvironmentConfig } from '~/config'

import {
    PaymentAgreementSummary,
    PaymentEngagementDetails,
    PaymentWorkLog,
    Winning,
} from '../../models/WinningDetail'

const WEEKLY_PAYMENT_DAYS = 5
const FORTNIGHTLY_PAYMENT_DAYS = 10
const MONTHLY_PAYMENT_DAYS_MIN = 20
const MONTHLY_PAYMENT_DAYS_MAX = 23
const AGREEMENT_AMOUNT_TOLERANCE = 0.01

type EngagementPaymentCycle = 'weekly' | 'fortnightly' | 'monthly'

function normalizeEngagementPaymentCycle(
    paymentCycle?: string,
): EngagementPaymentCycle {
    const normalizedCycle = paymentCycle?.trim()
        .toLowerCase()

    if (normalizedCycle === 'fortnightly' || normalizedCycle === 'biweekly') {
        return 'fortnightly'
    }

    if (normalizedCycle === 'monthly') {
        return 'monthly'
    }

    return 'weekly'
}

function getPaymentCycleWorkDays(paymentCycle: EngagementPaymentCycle): number {
    if (paymentCycle === 'fortnightly') {
        return FORTNIGHTLY_PAYMENT_DAYS
    }

    if (paymentCycle === 'monthly') {
        return MONTHLY_PAYMENT_DAYS_MIN
    }

    return WEEKLY_PAYMENT_DAYS
}

function resolveAgreementStatus(
    actualAmount: number,
    expectedAmount: number,
    expectedAmountMax?: number,
): PaymentAgreementSummary['status'] {
    if (expectedAmountMax !== undefined) {
        if (
            actualAmount >= expectedAmount - AGREEMENT_AMOUNT_TOLERANCE
            && actualAmount <= expectedAmountMax + AGREEMENT_AMOUNT_TOLERANCE
        ) {
            return 'match'
        }

        if (actualAmount < expectedAmount - AGREEMENT_AMOUNT_TOLERANCE) {
            return 'under'
        }

        return 'over'
    }

    const difference = actualAmount - expectedAmount

    if (Math.abs(difference) <= AGREEMENT_AMOUNT_TOLERANCE) {
        return 'match'
    }

    if (difference < -AGREEMENT_AMOUNT_TOLERANCE) {
        return 'under'
    }

    return 'over'
}

function resolveAgreementDifferenceAmount(
    actualAmount: number,
    expectedAmount: number,
    expectedAmountMax: number | undefined,
    status: PaymentAgreementSummary['status'],
): number {
    if (status === 'match') {
        return 0
    }

    if (expectedAmountMax !== undefined) {
        if (status === 'under') {
            return Number((expectedAmount - actualAmount).toFixed(2))
        }

        return Number((actualAmount - expectedAmountMax).toFixed(2))
    }

    return Math.abs(Number((actualAmount - expectedAmount).toFixed(2)))
}

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
        return engagementDetails.standardHoursPerWeek / WEEKLY_PAYMENT_DAYS
    }

    return undefined
}

export function getEngagementWorkDays(
    engagementDetails?: PaymentEngagementDetails,
): number {
    return getPaymentCycleWorkDays(
        normalizeEngagementPaymentCycle(engagementDetails?.paymentCycle),
    )
}

export function buildEngagementAgreementSummary(
    payment: Winning,
    engagementDetails?: PaymentEngagementDetails,
): PaymentAgreementSummary | undefined {
    const ratePerHour = parseRatePerHour(engagementDetails?.ratePerHour)
    const hoursPerDay = getEngagementHoursPerDay(engagementDetails)

    if (!ratePerHour || hoursPerDay === undefined || hoursPerDay <= 0) {
        return undefined
    }

    const paymentCycle = normalizeEngagementPaymentCycle(
        engagementDetails?.paymentCycle,
    )
    const workDays = getPaymentCycleWorkDays(paymentCycle)
    const expectedAmount = Number(
        (ratePerHour * hoursPerDay * workDays).toFixed(2),
    )
    const expectedAmountMax = paymentCycle === 'monthly'
        ? Number((ratePerHour * hoursPerDay * MONTHLY_PAYMENT_DAYS_MAX).toFixed(2))
        : undefined
    const actualAmount = payment.grossAmountNumber
    const status = resolveAgreementStatus(
        actualAmount,
        expectedAmount,
        expectedAmountMax,
    )
    const differenceAmount = resolveAgreementDifferenceAmount(
        actualAmount,
        expectedAmount,
        expectedAmountMax,
        status,
    )

    return {
        actualAmount,
        differenceAmount,
        expectedAmount,
        expectedAmountMax,
        hoursPerDay,
        paymentCycle: formatPaymentCycle(engagementDetails),
        ratePerHour,
        status,
        workDays,
    }
}

function formatAgreementRangePart(
    ratePerHour: number,
    hoursPerDay: number,
    workDays: number,
): string {
    const rate = formatCurrencyAmount(ratePerHour)

    return `${rate} x ${hoursPerDay} hours x ${workDays} days`
}

export function formatAgreementExpectedAmount(
    summary: PaymentAgreementSummary,
): string {
    if (summary.expectedAmountMax !== undefined) {
        return `${formatCurrencyAmount(summary.expectedAmount)} - ${
            formatCurrencyAmount(summary.expectedAmountMax)
        }`
    }

    return formatCurrencyAmount(summary.expectedAmount)
}

export function formatAgreementBreakdown(
    summary: PaymentAgreementSummary,
): string {
    if (summary.expectedAmountMax !== undefined) {
        return `${formatAgreementRangePart(
            summary.ratePerHour,
            summary.hoursPerDay,
            MONTHLY_PAYMENT_DAYS_MIN,
        )} - ${formatAgreementRangePart(
            summary.ratePerHour,
            summary.hoursPerDay,
            MONTHLY_PAYMENT_DAYS_MAX,
        )}`
    }

    return formatAgreementRangePart(
        summary.ratePerHour,
        summary.hoursPerDay,
        summary.workDays,
    )
}

export function formatAgreementDifferenceLabel(
    summary: PaymentAgreementSummary,
): string {
    const formattedDifference = `$${summary.differenceAmount.toLocaleString()}`

    if (summary.status === 'under') {
        return `${formattedDifference} less`
    }

    return `${formattedDifference} more`
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
 * Payment approver handle from finance payment-details (audit trail after approval).
 * Engagement payments return it on `engagementDetails`; task payments on `taskDetails`.
 */
export function resolvePaymentApproverHandle(
    paymentDetails?: {
        engagementDetails?: { paymentApproverHandle?: string }
        taskDetails?: { paymentApproverHandle?: string }
    },
    isTaskPayment: boolean = false,
): string | undefined {
    if (isTaskPayment) {
        return paymentDetails?.taskDetails?.paymentApproverHandle
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
    )
}

export function stripHtml(html: string, maxLength: number = 500): string {
    const div = document.createElement('div')
    div.innerHTML = html
    return (div.textContent ?? div.innerText ?? '').substring(0, maxLength)
}
