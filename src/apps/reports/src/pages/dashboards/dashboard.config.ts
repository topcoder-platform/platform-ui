import {
    ChallengeParticipationDashboard,
    DashboardSlug,
    DashboardsResponse,
    MemberPaymentByCustomerDashboard,
    MemberPaymentByMonthDashboard,
    MembersPaidDashboard,
    NewSignupsDashboard,
} from '../../lib/services'

export type DashboardResponse = NewSignupsDashboard
    | MembersPaidDashboard
    | MemberPaymentByMonthDashboard
    | MemberPaymentByCustomerDashboard
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
    valueType: 'count' | 'currency'
    xAxisTitle?: string
}

const customerSeriesColors: string[] = [
    '#0f62fe',
    '#6aae3f',
    '#6c5ce7',
    '#ff8a00',
    '#00a6ce',
]
const otherCustomersColor = '#d7476f'

export const dashboardDefinitions: Record<DashboardSlug, DashboardDefinition> = {
    'challenge-participation': {
        chartType: 'column',
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
        valueType: 'count',
    },
    'member-payment-by-customer': {
        chartType: 'column',
        index: 5,
        series: [],
        slug: 'member-payment-by-customer',
        stacked: true,
        subtitle: 'Monthly payment value split by customer spending',
        title: 'Member Payment $ by Customer',
        valueType: 'currency',
        xAxisTitle: 'Month',
    },
    'member-payment-by-month': {
        chartType: 'column',
        index: 4,
        series: [
            {
                color: '#0f62fe',
                key: 'taas',
                label: 'TAAS',
            },
            {
                color: '#6aae3f',
                key: 'task',
                label: 'Task',
            },
            {
                color: '#6c5ce7',
                key: 'challenge',
                label: 'Contest',
            },
            {
                color: '#ff8a00',
                key: 'engagement',
                label: 'Engagement',
            },
        ],
        slug: 'member-payment-by-month',
        stacked: true,
        subtitle: 'Split by Payment Types (TAAS, Task, Contest, Engagement)',
        title: 'Member Payment $ by Month',
        valueType: 'currency',
        xAxisTitle: 'Month',
    },
    'members-paid': {
        chartType: 'column',
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
        valueType: 'count',
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
        valueType: 'count',
    },
}

export const dashboardSlugs: DashboardSlug[] = [
    'new-signups',
    'members-paid',
    'challenge-participation',
    'member-payment-by-month',
    'member-payment-by-customer',
]

/**
 * Determines whether an unknown route value is a supported dashboard slug.
 *
 * @param value Candidate route parameter.
 * @returns True when the value identifies one of the reports dashboards.
 * @throws Does not throw.
 */
export function isDashboardSlug(value?: string): value is DashboardSlug {
    return dashboardSlugs.includes(value as DashboardSlug)
}

/**
 * Resolves the visible series for a dashboard response.
 *
 * Static dashboards use their configured fields. Customer payment dashboards
 * preserve the API's ranked series order and assign the reporting palette,
 * including the dedicated Other Customers color.
 *
 * @param response Dashboard API response whose series will be rendered.
 * @returns Ordered chart-series definitions with UI colors.
 * @throws Does not throw.
 */
export function getDashboardSeries(
    response: DashboardResponse,
): DashboardSeriesDefinition[] {
    if (response.dashboard !== 'member-payment-by-customer') {
        return dashboardDefinitions[response.dashboard].series
    }

    return response.series.map((series, index) => ({
        color: series.key === 'other-customers'
            ? otherCustomersColor
            : customerSeriesColors[index % customerSeriesColors.length],
        key: series.key,
        label: series.label,
    }))
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
        case 'member-payment-by-month':
            return dashboards.memberPaymentByMonth
        case 'member-payment-by-customer':
            return dashboards.memberPaymentByCustomer
        case 'new-signups':
        default:
            return dashboards.newSignups
    }
}
