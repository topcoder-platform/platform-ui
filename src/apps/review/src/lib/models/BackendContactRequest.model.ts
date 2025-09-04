/**
 * Backend response for contact request
 */
export interface BackendContactRequest {
    id: string
    createdBy: string
    createdAt: Date | string
    updatedAt: Date | string
    updatedBy: string
}
