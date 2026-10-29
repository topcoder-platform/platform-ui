import {
    EngagementLeadStatus,
    EngagementLeadType,
} from '../models/EngagementLead.model'

export type LeadDisplayStatus = 'New' | 'In Progress' | 'Converted' | 'Declined'

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

    if (status === EngagementLeadStatus.UNDER_REVIEW || status === EngagementLeadStatus.QUALIFIED) {
        return 'In Progress'
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

    if (displayStatus === 'In Progress') {
        return styles.statusInProgress
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

export function getWiproDirectLeadIntakeUrl(engagementsAppUrl: string): string {
    return `${engagementsAppUrl}/intake/wipro-direct`
}

export function formatLeadType(leadType?: string | null): string {
    if (leadType === EngagementLeadType.WIPRO_DIRECT) {
        return 'Wipro Direct'
    }

    return 'Wipro Consumption'
}

export function getEngagementLeadsListUrl(rootRoutePath: string, engagementLeadsRoute: string): string {
    return `${rootRoutePath}/${engagementLeadsRoute}`
}

export const LEAD_TYPE_TAB_PARAM = 'tab'

const WIPRO_DIRECT_TAB = 'wipro-direct'

export function getLeadTypeTabParam(leadType?: string | null): string {
    return leadType === EngagementLeadType.WIPRO_DIRECT ? WIPRO_DIRECT_TAB : 'wipro-consumption'
}

export function getLeadTypeFromTabParam(tab?: string | null): EngagementLeadType {
    return tab === WIPRO_DIRECT_TAB
        ? EngagementLeadType.WIPRO_DIRECT
        : EngagementLeadType.WIPRO_CONSUMPTION
}
