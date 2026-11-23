import { fetchEngagementLeads } from '../../work/src/lib/services/engagement-leads.service'
import { getLeadDisplayStatus, LeadDisplayStatus } from '../../work/src/lib/utils/engagement-leads.utils'

import type { SalesDashboardResponse } from './sales-dashboard.service'
import { salesFiscalYear } from './sales-fiscal-year'

const statuses: LeadDisplayStatus[] = [
    'New',
    'Under Review',
    'Fulfilled',
    'Partially Fulfilled',
    'On Hold',
    'Lost',
]

/** Counts each lead in its UTC creation month, using the same current status labels as Work. */
export async function fetchSalesLeadsReport(signal: AbortSignal): Promise<SalesDashboardResponse> {
    const now = new Date()
    const startYear = salesFiscalYear(now) - 1
    const start = Date.UTC(startYear, 3, 1)
    const annual = Object.fromEntries(statuses.map(status => [status, 0]))
    const months = Array.from({ length: 12 }, (_, index) => {
        const date = new Date(Date.UTC(startYear, 3 + index, 1))
        const values: Record<string, number> = date <= now ? { ...annual } : {}
        return {
            month: date.toISOString()
                .slice(0, 10),
            values,
        }
    })

    const counted = new Set<string>()
    let page = 1
    let totalPages: number
    do {
        // Fetch newest first so older fiscal years need at most one boundary page.
        // eslint-disable-next-line no-await-in-loop
        const response = await fetchEngagementLeads({
            page,
            perPage: 100,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        }, signal)
        const data = response.data
        for (const lead of data) {
            const created = new Date(lead.createdAt)
            if (created.getTime() >= start && created <= now && !counted.has(lead.id)) {
                const monthIndex = (created.getUTCMonth() + 9) % 12
                const status = getLeadDisplayStatus(lead.status)
                months[monthIndex].values[status] += 1
                annual[status] += 1
                counted.add(lead.id)
            }
        }

        if (!data.length || Date.parse(data[data.length - 1].createdAt) < start) break
        totalPages = response.meta.totalPages
        page += 1
    } while (page <= totalPages)

    return {
        charts: [{
            annual,
            description: 'Engagement leads by creation month (UTC) and current status',
            id: 'leads',
            months,
            series: statuses.map(status => ({ key: status, label: status })),
            stacked: false,
            title: 'Leads Report',
            unit: 'count',
        }],
        notices: [],
    }
}
