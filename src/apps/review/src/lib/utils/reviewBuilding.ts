/**
 * Util for building and resolving review objects for resources, including normalization and
 * canonical detail application.
 */
import {
    type BackendReview,
    type BackendSubmission,
    createEmptyBackendReview,
} from '../models'

/**
 * Parameters used when resolving a review for a resource.
 */
export type ReviewResolutionParams = {
    assignmentReview?: BackendReview
    challengeSubmission: BackendSubmission
    matchingReview?: BackendReview
    reviewerId: string
}

/**
 * Parameters for building a fully normalized review for a resource.
 */
export type BuildReviewForResourceParams = ReviewResolutionParams & {
    challengeReviewById: Map<string, BackendReview>
}

/**
 * Normalizes a string by trimming whitespace and discarding empty results.
 *
 * @param value - The string value to normalize.
 * @returns A trimmed string when non-empty; otherwise undefined.
 */
export function pickNormalizedString(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Resolves the base review data for a resource using assignment, matching, and fallback values.
 *
 * @param params - Resolution inputs containing potential review sources.
 * @returns A review object populated with fallback resource and submission identifiers when necessary.
 */
export function resolveBaseReviewForResource({
    assignmentReview,
    challengeSubmission,
    matchingReview,
    reviewerId,
}: ReviewResolutionParams): BackendReview {
    let reviewForResource = matchingReview

    if (assignmentReview) {
        const existingReviewItems = reviewForResource?.reviewItems
        reviewForResource = {
            ...(reviewForResource ?? {}),
            ...assignmentReview,
            resourceId: assignmentReview.resourceId
                ?? reviewForResource?.resourceId
                ?? reviewerId,
            reviewItems: existingReviewItems?.length
                ? existingReviewItems
                : assignmentReview.reviewItems ?? [],
            submissionId: assignmentReview.submissionId
                ?? reviewForResource?.submissionId
                ?? challengeSubmission.id,
        }
    }

    if (reviewForResource) {
        return reviewForResource
    }

    return {
        ...createEmptyBackendReview(),
        resourceId: reviewerId,
        submissionId: challengeSubmission.id,
    }
}

/**
 * Applies canonical review details, such as phase name and type, to the provided review.
 *
 * @param reviewForResource - The review resolved for the resource.
 * @param challengeReviewById - Map of canonical review data indexed by review identifier.
 * @returns The review with canonical metadata filled when available.
 */
export function applyCanonicalDetails(
    reviewForResource: BackendReview,
    challengeReviewById: Map<string, BackendReview>,
): BackendReview {
    const canonicalReview = reviewForResource.id
        ? challengeReviewById.get(reviewForResource.id)
        : undefined

    const preferredPhaseName = pickNormalizedString(reviewForResource.phaseName)
        ?? pickNormalizedString(canonicalReview?.phaseName)
    const preferredTypeId = pickNormalizedString(reviewForResource.typeId)
        ?? pickNormalizedString(canonicalReview?.typeId)

    const normalizedReview: BackendReview = {
        ...reviewForResource,
    }

    if (preferredPhaseName) {
        normalizedReview.phaseName = preferredPhaseName
    }

    if (preferredTypeId) {
        normalizedReview.typeId = preferredTypeId
    }

    return normalizedReview
}

/**
 * Builds a fully normalized review object for a resource.
 *
 * @param params - Inputs required to resolve and enrich the review data.
 * @returns The resolved review with canonical details applied.
 */
export function buildReviewForResource(params: BuildReviewForResourceParams): BackendReview {
    const baseReview = resolveBaseReviewForResource(params)
    return applyCanonicalDetails(baseReview, params.challengeReviewById)
}
