export interface ReviewSummary {
    /** Challenge uuid */
    challengeId: string
    /** Challenge Name */
    challengeName: string
    /** Challenge Status */
    challengeStatus: string
    /** Challenge Id */
    legacyChallengeId: string
    /** Number Of Approved Applications */
    numberOfApprovedApplications: number
    /** Number Of Pending Applications */
    numberOfPendingApplications: number
    /** Number Of Reviewer Spots */
    numberOfReviewerSpots: number
    /** Number Of Submissions */
    numberOfSubmissions: number
    /** Submission End Date */
    submissionEndDate: string
}
