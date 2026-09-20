/** A numeric report column totalled across every matching row, not only the current page. */
export interface SalesSummaryAmount {
    columnId: string
    label: string
    total: number
    count: number
    /** True when contributing rows declared different currencies, making the total a bare sum. */
    mixedCurrency: boolean
    currencyCode?: string
}

/** One distinct value of a category column, such as a pipeline stage. */
export interface SalesSummaryBucket {
    label: string
    count: number
    total: number
    /**
     * Every numeric column totalled inside this bucket, in the same order as
     * `SalesSummary.amounts`. Optional so a response from an API that predates
     * PM-6392 still renders, using `total` alone.
     */
    amounts?: SalesSummaryAmount[]
}

/** A category column broken down into its distinct values, largest total first. */
export interface SalesSummaryGroup {
    columnId: string
    label: string
    amountColumnId?: string
    mixedCurrency: boolean
    currencyCode?: string
    buckets: SalesSummaryBucket[]
    otherBuckets: number
}

/** Aggregates the API recomputes over every matching row for the active query. */
export interface SalesSummary {
    recordCount: number
    amounts: SalesSummaryAmount[]
    groups: SalesSummaryGroup[]
}

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
    summary?: SalesSummary
}

export interface SalesQuery {
    page: number
    perPage: number
    search?: string
    filterColumn?: string
    filterValue?: string
    /** Column the returned page drills into; requires drilldownValue. */
    drilldownColumn?: string
    /**
     * Exact displayed value the page drills into, such as a pipeline stage.
     * The drilldown narrows the rows only, so the summary still describes every
     * bucket and the stage breakdown stays on screen while one stage is selected.
     */
    drilldownValue?: string
    /** Date or datetime column the range applies to, such as Created Date or Close Date. */
    dateColumn?: string
    /** Inclusive YYYY-MM-DD lower bound; requires dateColumn. */
    dateFrom?: string
    /** Inclusive YYYY-MM-DD upper bound; requires dateColumn. */
    dateTo?: string
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
