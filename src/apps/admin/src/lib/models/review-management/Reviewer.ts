export interface Reviewer {
    /** User Id */
    userId: number,
    /** User handle */
    handle: string,
    /** User email */
    emailAddress: string,
    /** Application Status */
    applicationStatus: string,
    /** Review Auction Id */
    reviewAuctionId: number,
    /** Application Role Id */
    applicationRoleId: number,
    /** Application Role */
    applicationRole: string,
    /** Application Date */
    applicationDate: string,
    /** Number of completed reviews in last 60 days */
    reviewsInPast60Days: number,
    /** Current number of open reviews */
    currentNumberOfReviewPositions: number
}
