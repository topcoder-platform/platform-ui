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
