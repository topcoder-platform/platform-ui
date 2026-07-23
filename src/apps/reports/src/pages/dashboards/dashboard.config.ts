import {
    ChallengeParticipationDashboard,
    DashboardSlug,
    DashboardsResponse,
    MembersPaidDashboard,
    NewSignupsDashboard,
} from '../../lib/services'

export type DashboardResponse = NewSignupsDashboard
    | MembersPaidDashboard
    | ChallengeParticipationDashboard

export type DashboardMonth = DashboardResponse['months'][number]

export type DashboardSeriesDefinition = {
    color: string
    key: string
    label: string
}

export type DashboardDefinition = {
    chartType: 'bar' | 'column'
    index: number
    series: DashboardSeriesDefinition[]
    slug: DashboardSlug
    stacked: boolean
    subtitle: string
    title: string
}

export const dashboardDefinitions: Record<DashboardSlug, DashboardDefinition> = {
    'challenge-participation': {
        chartType: 'bar',
        index: 3,
        series: [
            {
                color: '#0f62fe',
                key: 'registrants',
                label: 'Registrants',
            },
            {
                color: '#6aae3f',
                key: 'submitters',
                label: 'Submitters',
            },
        ],
        slug: 'challenge-participation',
        stacked: false,
        subtitle: 'Monthly unique registrants and submitters',
        title: 'Challenge Registrants vs Submitters',
    },
    'members-paid': {
        chartType: 'bar',
        index: 2,
        series: [
            {
                color: '#0f62fe',
                key: 'taas',
                label: 'TaaS',
            },
            {
                color: '#6aae3f',
                key: 'task',
                label: 'Task',
            },
            {
                color: '#6c5ce7',
                key: 'challenge',
                label: 'Challenge',
            },
            {
                color: '#ff8a00',
                key: 'engagement',
                label: 'Engagement',
            },
        ],
        slug: 'members-paid',
        stacked: true,
        subtitle: 'Split by payment type (TaaS, Task, Challenge, Engagement)',
        title: 'Unique Members Paid per Month',
    },
    'new-signups': {
        chartType: 'column',
        index: 1,
        series: [
            {
                color: '#0f62fe',
                key: 'activated',
                label: 'Activated Members',
            },
            {
                color: '#aeb5c8',
                key: 'notActivated',
                label: 'Not Activated Members',
            },
        ],
        slug: 'new-signups',
        stacked: true,
        subtitle: 'Split by Activated vs Not Activated Members',
        title: 'New Signups by Month',
    },
}

export const dashboardSlugs: DashboardSlug[] = [
    'new-signups',
    'members-paid',
    'challenge-participation',
]

/**
 * Determines whether an unknown route value is a supported dashboard slug.
 *
 * @param value Candidate route parameter.
 * @returns True when the value identifies one of the three reports dashboards.
 * @throws Does not throw.
 */
export function isDashboardSlug(value?: string): value is DashboardSlug {
    return dashboardSlugs.includes(value as DashboardSlug)
}

/**
 * Selects one dashboard response from the landing-page aggregate.
 *
 * @param dashboards Aggregate dashboard API response.
 * @param slug Dashboard route identifier.
 * @returns The response associated with the requested dashboard.
 * @throws Does not throw.
 */
export function getDashboardResponse(
    dashboards: DashboardsResponse,
    slug: DashboardSlug,
): DashboardResponse {
    switch (slug) {
        case 'members-paid':
            return dashboards.membersPaid
        case 'challenge-participation':
            return dashboards.challengeParticipation
        case 'new-signups':
        default:
            return dashboards.newSignups
    }
}
