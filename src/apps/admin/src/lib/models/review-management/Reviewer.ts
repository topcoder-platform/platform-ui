export interface Reviewer {
    /** Review application identifier */
    applicationId: string;
    /** User Id */
    userId: number;
    /** User handle */
    handle: string;
    /** User email */
    emailAddress: string;
    /** Application Status */
    applicationStatus: string;
    /** Application Role */
    applicationRole: string;
    /** Application Date */
    applicationDate: string;
    /** Number of completed reviews in last 60 days */
    reviewsInPast60Days: number;
    /** Current number of open reviews */
    currentNumberOfReviewPositions: number;
}
