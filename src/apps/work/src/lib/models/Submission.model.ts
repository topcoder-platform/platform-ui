export type SubmissionStatus = 'active' | 'completed' | 'deleted' | 'failed' | 'pending' | string

export interface SubmissionReview {
    createdAt?: string
    id?: string
    initialScore?: number
    isPassing?: boolean
    reviewerHandle?: string
    reviewerId?: string
    score?: number
    status?: string
    submissionId?: string
    typeId?: string
}

export interface ReviewSummation {
    aggregateScore?: number
    createdAt?: string
    id?: string
    isFinal?: boolean
    isPassing?: boolean
    isProvisional?: boolean
    memberId?: string
    submissionId?: string
}

export interface Submission {
    challengeId: string
    created?: string
    createdAt?: string
    createdBy: string
    email?: string
    fileType?: string
    id: string
    legacySubmissionId?: string
    memberHandle?: string
    memberId?: string
    rating?: number
    review?: SubmissionReview[]
    reviewSummation?: ReviewSummation[]
    status?: SubmissionStatus
    submissionTime?: string
    type?: string
}
