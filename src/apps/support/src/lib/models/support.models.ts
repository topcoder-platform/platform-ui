/** Domain models returned by support-api-v6. */
export type SupportTicketStatus = 'OPEN' | 'CLOSED'

export interface SupportAssignee {
    userId: string
    handle: string
    handleColor?: string
    assignedAt: string
}

export interface SupportReadReceipt {
    userId: string
    readAt: string
}

export interface SupportResponse {
    id: string
    userId: string
    userHandle: string
    userHandleColor?: string
    markdown: string
    createdAt: string
    readBy: SupportReadReceipt[]
}

export interface SupportTicketSummary {
    id: string
    memberUserId: string
    memberHandle: string
    memberHandleColor?: string
    challengeId?: string
    description: string
    status: SupportTicketStatus
    openedAt: string
    closedAt?: string
    updatedAt: string
    latestActivityAt: string
    responseCount: number
    hasUnread: boolean
    assignees: SupportAssignee[]
}

export interface SupportTicketDetail extends SupportTicketSummary {
    readBy: SupportReadReceipt[]
    responses: SupportResponse[]
}

export interface SupportPaginationMeta {
    page: number
    perPage: number
    totalCount: number
    totalPages: number
}

export interface SupportTicketPage {
    data: SupportTicketSummary[]
    meta: SupportPaginationMeta
}

export interface SupportTicketQuery {
    status: SupportTicketStatus
    page: number
    perPage: number
    memberHandle?: string
    challengeId?: string
    description?: string
}

export interface CreateSupportTicketRequest {
    challengeId?: string
    description: string
}

export interface CreateSupportResponseRequest {
    markdown: string
}

export interface MemberAutocompleteOption {
    userId: string
    handle: string
}
