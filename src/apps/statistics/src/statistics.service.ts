import { EnvironmentConfig } from '~/config'

import { ReportRow } from './reports'

/** Read public reports without requiring a member session. */
export async function fetchStatistics(path: string): Promise<ReportRow[]> {
    const response = await fetch(`${EnvironmentConfig.REPORTS_API}/statistics/${path}`)
    if (!response.ok) throw new Error('Statistics could not be loaded. Please try again.')
    const data: unknown = await response.json()
    const rows = Array.isArray(data) ? data : [data]
    if (!rows.every(row => row !== null && typeof row === 'object' && !Array.isArray(row))) {
        throw new Error('The statistics report returned an unexpected response.')
    }

    return rows as ReportRow[]
}

/** Format zero and numeric strings without changing member handles or dates. */
export function formatValue(value: string | number | null | undefined, isMember: boolean = false): string {
    if (value === null || value === undefined) return '—'
    if (!isMember && /^-?\d+(\.\d+)?$/.test(String(value))) {
        return Number(value)
            .toLocaleString('en-US', { maximumFractionDigits: 2 })
    }

    return String(value)
}

export const reportOptions = { revalidateOnFocus: false, shouldRetryOnError: false }
