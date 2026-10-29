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

// Leads are a tab of the Engagements page (`?tab=leads`), so the lead type tab needs its own param.
export const ENGAGEMENTS_LEADS_TAB = 'leads'
export const LEAD_TYPE_QUERY_PARAM = 'leadType'

const WIPRO_DIRECT_QUERY_VALUE = 'wipro-direct'

export function getLeadTypeQueryValue(leadType?: string | null): string {
    return leadType === EngagementLeadType.WIPRO_DIRECT ? WIPRO_DIRECT_QUERY_VALUE : 'wipro-consumption'
}

export function getLeadTypeFromQueryValue(value?: string | null): EngagementLeadType {
    return value === WIPRO_DIRECT_QUERY_VALUE
        ? EngagementLeadType.WIPRO_DIRECT
        : EngagementLeadType.WIPRO_CONSUMPTION
}

/**
 * Path of the Leads tab on the Engagements page, relative to the Work app root.
 * @param leadType Lead type whose tab should open; defaults to Wipro Consumption.
 * @returns `/engagements?tab=leads&leadType=...`.
 */
export function getEngagementLeadsTabPath(leadType?: string | null): string {
    const params = new URLSearchParams()
    params.set('tab', ENGAGEMENTS_LEADS_TAB)
    params.set(LEAD_TYPE_QUERY_PARAM, getLeadTypeQueryValue(leadType))

    return `/engagements?${params.toString()}`
}
