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
 * @param value Textarea content from engagement payment details.
 * @returns `-` when no content exists, otherwise the original text with any
 * detected `http://` or `https://` URLs rendered as anchor nodes.
 *
 * @remarks Used by the payment-details popup for the engagement "Other
 * Remarks" field so admins can open referenced URLs directly.
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

export function formatEngagementProjectName(
    engagementDetails?: PaymentEngagementDetails,
): string {
    const projectName = String(engagementDetails?.projectName || '')
        .trim()
    const engagementTitle = String(engagementDetails?.engagementTitle || '')
        .trim()

    if (projectName && engagementTitle) {
        return `${projectName} / ${engagementTitle}`
    }

    return projectName || engagementTitle || '-'
}
