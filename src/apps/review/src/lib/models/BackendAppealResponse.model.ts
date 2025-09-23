/**
 * Backend model for appeal response
 */
export interface BackendAppealResponseBase {
    appealId: string
    resourceId: string
    content: string
    success: boolean
}

export interface BackendAppealResponse extends BackendAppealResponseBase {
    id: string
    createdAt: string
    createdBy: string
    updatedAt: string
    updatedBy: string
}
