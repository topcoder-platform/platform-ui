/** Metadata-driven report contract shared by Sales and the WIN integration. */
export interface SalesReport {
    reportId: string
    reportName: string
    columns: Array<{ id: string; label: string; dataType: string }>
    rows: Array<{
        id: string
        cells: Array<{ label: string; value: string | number | boolean | null; currencyCode?: string }>
    }>
    allData: boolean
    sourceRowCount: number
    total: number
    page: number
    perPage: number
    totalPages: number
    refreshedAt: string
    refreshAfterSeconds: number
}

export interface SalesQuery {
    page: number
    perPage: number
    search?: string
    filterColumn?: string
    filterValue?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    refresh?: boolean
}

/**
 * Salesforce opportunity record ids: the `006` key prefix followed by 12 or 15
 * case-sensitive alphanumeric characters. Report cells carrying the opportunity
 * name expose this id as their value.
 */
const OPPORTUNITY_ID_PATTERN = /^006[a-zA-Z0-9]{12}(?:[a-zA-Z0-9]{3})?$/

/**
 * Detects the report cell value that identifies a Salesforce opportunity.
 * @param value Raw cell value from the sales report.
 * @returns The opportunity id when the cell carries one, otherwise undefined.
 * @throws Does not throw.
 */
export function toOpportunityId(value: string | number | boolean | null): string | undefined {
    return typeof value === 'string' && OPPORTUNITY_ID_PATTERN.test(value) ? value : undefined
}
