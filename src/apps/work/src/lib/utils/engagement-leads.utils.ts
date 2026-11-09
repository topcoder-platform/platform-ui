import {
    EngagementLead,
    EngagementLeadStatus,
    EngagementLeadType,
} from '../models/EngagementLead.model'

export type LeadDisplayStatus = 'New' | 'Under Review' | 'Fulfilled' | 'Lost'

export function formatLeadLabel(value: string): string {
    return value
        .toLowerCase()
        .replace(/_/g, ' ')
}

// Leads qualified or converted before those statuses were retired count as under review.
const UNDER_REVIEW_STATUSES: string[] = [
    EngagementLeadStatus.UNDER_REVIEW,
    EngagementLeadStatus.QUALIFIED,
    EngagementLeadStatus.CONVERTED,
]

export function getLeadDisplayStatus(status: string): LeadDisplayStatus {
    if (status === EngagementLeadStatus.FULFILLED) {
        return 'Fulfilled'
    }

    if (status === EngagementLeadStatus.REJECTED) {
        return 'Lost'
    }

    if (UNDER_REVIEW_STATUSES.includes(status)) {
        return 'Under Review'
    }

    return 'New'
}

/**
 * Statuses a Talent Manager can move a lead to from the lead view page.
 * @param status Current lead status.
 * @returns The next statuses, in the order their buttons are shown.
 */
export function getLeadStatusTransitions(status: string): EngagementLeadStatus[] {
    const displayStatus = getLeadDisplayStatus(status)

    if (displayStatus === 'New') {
        return [
            EngagementLeadStatus.UNDER_REVIEW,
            EngagementLeadStatus.FULFILLED,
            EngagementLeadStatus.REJECTED,
        ]
    }

    if (displayStatus === 'Lost') {
        return [EngagementLeadStatus.UNDER_REVIEW, EngagementLeadStatus.FULFILLED]
    }

    if (displayStatus === 'Under Review') {
        return [EngagementLeadStatus.FULFILLED, EngagementLeadStatus.REJECTED]
    }

    return [EngagementLeadStatus.UNDER_REVIEW]
}

export function getLeadDisplayStatusClassName(
    status: string,
    styles: Record<string, string>,
): string {
    const displayStatus = getLeadDisplayStatus(status)

    if (displayStatus === 'Fulfilled') {
        return styles.statusFulfilled
    }

    if (displayStatus === 'Lost') {
        return styles.statusLost
    }

    if (displayStatus === 'Under Review') {
        return styles.statusUnderReview
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

export function formatLeadDateTime(value: string): string {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
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

// Only new leads and leads under review can still become an engagement; each lead gets at most one.
export function canCreateEngagementFromLead(lead: Pick<EngagementLead, 'convertedEngagementId' | 'status'>): boolean {
    const displayStatus = getLeadDisplayStatus(String(lead.status))

    return !lead.convertedEngagementId
        && (displayStatus === 'New' || displayStatus === 'Under Review')
}

export function getLeadIntakeUrl(engagementsAppUrl: string): string {
    return `${engagementsAppUrl}/intake`
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
