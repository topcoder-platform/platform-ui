export type SubmissionStatus = 'active' | 'completed' | 'deleted' | 'failed' | 'pending' | string
export type MarathonMatchTestProcess = 'provisional' | 'system' | string
export type MarathonMatchTestStatus = 'FAILED' | 'IN PROGRESS' | 'SUCCESS' | string

export interface SubmissionReview {
    createdAt?: string
    finalScore?: number
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

export interface ReviewSummationTestProgressDetails {
    completedTests?: number
    failedTests?: number
    message?: string
    progress?: number
    reviewId?: string
    status?: MarathonMatchTestStatus
    testProcess?: MarathonMatchTestProcess
    totalTests?: number
    updatedAt?: string
    [key: string]: unknown
}

export interface ReviewSummationMetadata {
    reviewTypeId?: string
    testProcess?: MarathonMatchTestProcess
    testProgress?: number
    testProgressDetails?: ReviewSummationTestProgressDetails
    testStatus?: MarathonMatchTestStatus
    testType?: MarathonMatchTestProcess
    [key: string]: unknown
}

export interface ReviewSummation {
    aggregateScore?: number
    createdAt?: string
    id?: string
    isFinal?: boolean
    isPassing?: boolean
    isProvisional?: boolean
    memberId?: string
    metadata?: ReviewSummationMetadata
    submissionId?: string
    updatedAt?: string
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
