import type { IsRemovingType } from '~/apps/admin/src/lib/models'

import type { ChallengeInfo } from '../../models/ChallengeInfo.model'
import type { SubmissionInfo } from '../../models/SubmissionInfo.model'
import type {
    AggregatedReviewDetail,
    AggregatedSubmissionReviews,
} from '../../utils/aggregateSubmissionReviews'

/**
 * Table row shape enriched with aggregated review data resolved in advance.
 */
export interface SubmissionRow extends SubmissionInfo {
    /**
     * Aggregated review information for the submission, precomputed for renderers.
     */
    aggregated?: AggregatedSubmissionReviews
}

/**
 * Flattened row shape representing a single reviewer entry for a submission.
 * Each logical submission can expand to multiple SubmissionReviewerRow entries
 * (one per reviewer), while preserving the original submission fields.
 */
export interface SubmissionReviewerRow extends SubmissionRow {
    /** Zero-based index of the reviewer within aggregated.reviews for this submission. */
    reviewerIndex: number
    /** True when this is the first reviewer row for the submission. */
    isFirstReviewerRow: boolean
    /** True when this is the last reviewer row for the submission. */
    isLastReviewerRow: boolean
}

/**
 * Build a flattened list of per-reviewer rows from aggregated submission rows.
 * Each SubmissionRow is expanded to one or more SubmissionReviewerRow entries.
 */
export function buildSubmissionReviewerRows(
    submissions: SubmissionRow[],
): SubmissionReviewerRow[] {
    const rows: SubmissionReviewerRow[] = []

    submissions.forEach(submission => {
        const reviews = submission.aggregated?.reviews ?? []
        const reviewCount = reviews.length || 1

        for (let reviewerIndex = 0; reviewerIndex < reviewCount; reviewerIndex += 1) {
            rows.push({
                ...submission,
                reviewerIndex,
                isFirstReviewerRow: reviewerIndex === 0,
                isLastReviewerRow: reviewerIndex === reviewCount - 1,
            })
        }
    })

    return rows
}

/**
 * Shared configuration available to column renderers that need challenge-level context.
 */
export interface ColumnRendererConfig {
    /** Whether the challenge has already completed. */
    isChallengeCompleted?: boolean
    /** Member IDs that belong to the current user in this challenge context. */
    ownedMemberIds: Set<string>
    /** True when the surrounding table is rendered in the appeals tab. */
    isAppealsTab?: boolean
    /** True when the surrounding table is rendered in the submissions tab. */
    isSubmissionTab?: boolean
    /** True when the challenge allows appeals for submissions. */
    allowsAppeals?: boolean
    /** Full challenge information, passed when renderers need additional metadata. */
    challengeInfo?: ChallengeInfo
}

/**
 * Configuration for building the submission-download control and tooltips.
 */
export interface DownloadButtonConfig {
    /** Tracks download-in-flight state by submission ID. */
    isDownloading: IsRemovingType
    /** Callback invoked when a submission should be downloaded. */
    downloadSubmission: (submissionId: string) => void
    /** Determines whether members must be restricted to their own submissions. */
    shouldRestrictSubmitterToOwnSubmission: boolean
    /** Returns true when a given member's submissions are restricted. */
    isSubmissionDownloadRestrictedForMember: (memberId: string | undefined) => boolean
    /** Returns a member-specific restriction tooltip message when available. */
    getRestrictionMessageForMember: (memberId: string | undefined) => string | undefined
    /** Global restriction flag controlling download availability. */
    isSubmissionDownloadRestricted: boolean
    /** Optional global restriction message surfaced in a tooltip. */
    restrictionMessage?: string
    /** Member IDs the current user owns, used to determine ownership restrictions. */
    ownedMemberIds: Set<string>
    /** Message displayed when submission download fails due to virus scan. */
    virusScanFailedMessage?: string
    /** Tooltip used when a user is limited to downloading their own submission. */
    downloadOwnSubmissionTooltip?: string
    /** Method to determine whether a submission is viewable. */
    isSubmissionNotViewable?: (submission: SubmissionRow) => boolean
}

/**
 * Configuration describing when review scores or scorecards should be visible.
 */
export interface ScoreVisibilityConfig {
    /** Predicate indicating whether scores for the submission should be revealed. */
    canDisplayScores: (submission: SubmissionRow) => boolean
    /** Whether the viewer can navigate to the detailed scorecard for the submission. */
    canViewScorecard: boolean
    /** Tooltip message shown when scorecard access is restricted. */
    viewOwnScorecardTooltip?: string
    /** True when the parent table is rendered within the appeals tab. */
    isAppealsTab?: boolean
    /** Optional function to build review detail URLs by ID. */
    getReviewUrl?: (reviewId: string) => string
    /** Indicates whether the viewer can appeal to respond. */
    canRespondToAppeals?: boolean
}

export type { AggregatedReviewDetail, AggregatedSubmissionReviews }
