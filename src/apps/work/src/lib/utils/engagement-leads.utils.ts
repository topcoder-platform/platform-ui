import {
    EngagementLeadStatus,
} from '../models/EngagementLead.model'

export type LeadDisplayStatus = 'New' | 'Converted' | 'Declined'

export function formatLeadLabel(value: string): string {
    return value
        .toLowerCase()
        .replace(/_/g, ' ')
}

export function getLeadDisplayStatus(status: string): LeadDisplayStatus {
    if (status === EngagementLeadStatus.CONVERTED) {
        return 'Converted'
    }

    if (status === EngagementLeadStatus.REJECTED) {
        return 'Declined'
    }

    return 'New'
}

export function getLeadDisplayStatusClassName(
    status: string,
    styles: Record<string, string>,
): string {
    const displayStatus = getLeadDisplayStatus(status)

    if (displayStatus === 'Converted') {
        return styles.statusConverted
    }

    if (displayStatus === 'Declined') {
        return styles.statusDeclined
    }

    return styles.statusNew
}

export function formatLeadDate(value: string): string {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleDateString()
}

export function formatLeadAge(value: string): string {
    const created = new Date(value)

    if (Number.isNaN(created.getTime())) {
        return value
    }

    const diffMs = Date.now() - created.getTime()
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (days <= 0) {
        return 'Today'
    }

    if (days === 1) {
        return '1 day'
    }

    return `${days} days`
}

export function canCreateEngagementFromLead(status: string): boolean {
    return status !== EngagementLeadStatus.CONVERTED
        && status !== EngagementLeadStatus.REJECTED
}

export function getLeadIntakeUrl(engagementsAppUrl: string): string {
    return `${engagementsAppUrl}/intake`
}

export function getEngagementLeadsListUrl(rootRoutePath: string, engagementLeadsRoute: string): string {
    return `${rootRoutePath}/${engagementLeadsRoute}`
}
