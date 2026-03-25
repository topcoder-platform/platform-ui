/**
 * Generic API response wrapper from the arena-manager api.
 */
export interface ResponseObject<T> {
    data: T
    success: boolean
    message: string
}
