export interface Feedback {
    id: string
    engagementId: string
    feedbackText: string
    rating?: number
    givenByMemberId: number | null
    givenByHandle: string | null
    givenByEmail: string | null
    createdAt: string
    updatedAt: string
}

export interface CreateFeedbackRequest {
    feedbackText: string
    rating?: number
}

export interface GenerateFeedbackLinkRequest {
    customerEmail: string
    expirationDays?: number
}

export interface GenerateFeedbackLinkResponse {
    secretToken: string
    feedbackUrl: string
    expiresAt: string
}

export interface AnonymousFeedbackResponse {
    memberHandle: string
    feedbackText: string
    rating?: number | null
}
