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
