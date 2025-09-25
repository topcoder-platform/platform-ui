/**
 * Generic representation of paginated API responses coming from the v6 services.
 */
export interface PaginatedResponseV6<T> {
    data: T[]
    page: number
    perPage: number
    total: number
    totalPages: number
}

