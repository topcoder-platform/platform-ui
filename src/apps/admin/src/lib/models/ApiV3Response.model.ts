/**
 * Model for api v3 response
 */
export interface ApiV3Response<T> {
    result: {
        content: T
        success: boolean
    }
}
