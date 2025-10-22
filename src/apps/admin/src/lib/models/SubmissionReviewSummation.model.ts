/**
 * Model for submission review summation info
 */
export interface SubmissionReviewSummation {
    aggregateScore: number
    id: string
    isProvisional?: boolean | null
    isFinal?: boolean | null
    createdAt: Date | string
    submissionId: string
    submitterId?: number | null
    submitterHandle?: string | null
    submitterMaxRating?: number | null
}
