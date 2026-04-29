import React from 'react'

import { EnvironmentConfig } from '~/config'

import { PaymentEngagementDetails } from '../../models/WinningDetail'

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

    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}
