export type ReviewFilterCriteria = {
    /** Pagination current page */
    page: number
    /** Pagination page size */
    perPage: number
    /** Sort direction */
    order: 'asc' | 'desc'
    /** Sort field name */
    sortBy: string
}
