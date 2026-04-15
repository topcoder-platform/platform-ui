import type { Screening } from '../models'

/**
 * Determine whether the current viewer is assigned to the provided screening row.
 *
 * Usage:
 * This helper is used by screening/checkpoint table renderers to decide whether
 * action controls should be shown immediately, even when `myReviewResourceId`
 * has not been hydrated yet.
 *
 * @param entry - Screening row candidate containing assignment resource identifiers.
 * @param myResourceIds - Resource ids that belong to the current viewer.
 * @returns `true` when any assignment resource id in the row matches the viewer.
 */
export const isViewerAssignedToScreening = (
    entry: Pick<Screening, 'myReviewResourceId' | 'screenerId'>,
    myResourceIds: Set<string>,
): boolean => {
    const candidateResourceIds = [
        entry.myReviewResourceId,
        entry.screenerId,
    ]
        .map(id => id?.trim())
        .filter((id): id is string => Boolean(id))

    return candidateResourceIds.some(id => myResourceIds.has(id))
}

/**
 * Resolve the review id for row actions and scorecard navigation.
 *
 * Usage:
 * Screening/checkpoint tables prefer `myReviewId` for viewer-specific actions and
 * fall back to `reviewId` so the action column remains usable during initial load.
 *
 * @param entry - Screening row candidate containing review identifiers.
 * @returns The first non-empty review id, or `undefined` if none are available.
 */
export const resolveViewerReviewId = (
    entry: Pick<Screening, 'myReviewId' | 'reviewId'>,
): string | undefined => {
    const candidateReviewIds = [
        entry.myReviewId,
        entry.reviewId,
    ]
        .map(id => id?.trim())
        .filter((id): id is string => Boolean(id))

    return candidateReviewIds[0]
}

/**
 * Resolve an assignment status string for the current viewer from a screening row.
 *
 * Usage:
 * This normalizes mixed status sources (`myReviewStatus` and `reviewStatus`) so
 * table actions can consistently detect completed/submitted assignments.
 *
 * @param entry - Screening row candidate containing review status fields.
 * @returns Upper-cased status string, or an empty string when no status exists.
 */
export const resolveViewerReviewStatus = (
    entry: Pick<Screening, 'myReviewStatus' | 'reviewStatus'>,
): string => (entry.myReviewStatus ?? entry.reviewStatus ?? '').toUpperCase()
