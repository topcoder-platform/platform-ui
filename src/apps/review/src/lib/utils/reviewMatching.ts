/**
 * Util for matching reviews to challenge phases based on multiple criteria including phase IDs,
 * scorecards, types, and metadata.
 */
import type { BackendReview } from '../models'

import {
    buildMetadataCriteria,
    findMetadataPhaseMatch,
    getNormalizedAlphaLowerCase,
    getNormalizedLowerCase,
    type MetadataPhaseMatchDetail,
    normalizeReviewMetadata,
} from './metadataMatching'
import { debugLog, truncateForLog } from './screeningReviewDebug'

/**
 * Resolves the phase identifier associated with a review.
 *
 * @param review - Review whose phase identifier should be read.
 * @returns Normalized string representation of the phase identifier when present.
 */
export function resolveReviewPhaseId(review: BackendReview | undefined): string | undefined {
    if (!review || review.phaseId === null || review.phaseId === undefined) {
        return undefined
    }

    return `${review.phaseId}`
}

/**
 * Collects the criteria that matched when comparing a review against a set of phase constraints.
 *
 * @param matchesPhase - Whether the review matched by phase identifier.
 * @param matchesScorecard - Whether the review matched by scorecard identifier.
 * @param matchesTypeExact - Whether the review matched by type identifier exactly.
 * @param metadataCriteria - Metadata criteria that matched.
 * @returns Array of string criteria describing the match sources.
 */
export function collectMatchedCriteria({
    matchesPhase,
    matchesScorecard,
    matchesTypeExact,
    matchesReviewTypeName,
    metadataCriteria,
}: {
    matchesPhase: boolean
    matchesScorecard: boolean
    matchesTypeExact: boolean
    matchesReviewTypeName: boolean
    metadataCriteria: string[]
}): string[] {
    const criteria: string[] = []

    if (matchesScorecard) {
        criteria.push('scorecardId')
    }

    if (matchesPhase) {
        criteria.push('phaseId')
    }

    if (matchesTypeExact) {
        criteria.push('typeIdExact')
    }

    if (matchesReviewTypeName) {
        criteria.push('reviewType')
    }

    criteria.push(...metadataCriteria)

    return criteria
}

interface ResolvePhaseMatchArguments {
    matchesPhase: boolean
    matchesScorecard: boolean
    normalizedPhaseName?: string
    normalizedPhaseNameForReviewType?: string
    normalizedReviewPhaseName?: string
    normalizedReviewTypeAlpha?: string
    review: BackendReview
    reviewPhaseName?: string | null
    reviewType?: string | null
}

function resolvePhaseOrTypeMatch({
    matchesPhase,
    matchesScorecard,
    normalizedPhaseName,
    normalizedPhaseNameForReviewType,
    normalizedReviewPhaseName,
    normalizedReviewTypeAlpha,
    review,
    reviewPhaseName,
    reviewType,
}: ResolvePhaseMatchArguments): boolean | undefined {
    if (!normalizedPhaseName) {
        return handleNoPhaseMatch(review, matchesPhase, matchesScorecard)
    }

    if (normalizedReviewPhaseName) {
        return enforceExactPhaseNameMatch({
            normalizedPhaseName,
            normalizedReviewPhaseName,
            review,
            reviewPhaseName: reviewPhaseName ?? '',
        })
    }

    if (normalizedReviewTypeAlpha && reviewType && normalizedPhaseNameForReviewType) {
        return enforceExactReviewTypeMatch({
            normalizedPhaseName: normalizedPhaseNameForReviewType,
            normalizedReviewType: normalizedReviewTypeAlpha,
            review,
            reviewType,
        })
    }

    return undefined
}

/**
 * Emits debugging information when a review is missing during phase matching logic.
 *
 * @param phaseIds - Phase identifiers that were being checked.
 * @param phaseName - Name of the phase being matched.
 * @param scorecardId - Scorecard identifier under consideration.
 */
export function logMissingReview(
    phaseIds: Set<string>,
    phaseName: string | undefined,
    scorecardId: string | undefined,
): void {
    debugLog('reviewMatchesPhase.start', {
        phaseIds: Array.from(phaseIds.values()),
        phaseName,
        reason: 'reviewMissing',
        reviewId: undefined,
        scorecardIdBeingChecked: scorecardId,
    })
    debugLog('reviewMatchesPhase.summary', {
        matchedCriteria: [],
        matchReason: 'none',
        result: false,
        reviewId: undefined,
    })
}

/**
 * Handles matching when no phase name is supplied by relying on other criteria.
 *
 * @param review - Review being evaluated.
 * @param matchesPhase - Whether the review matched the provided phase identifiers.
 * @param matchesScorecard - Whether the review matched the scorecard identifier.
 * @returns True when any of the alternative criteria matched.
 */
export function handleNoPhaseMatch(
    review: BackendReview,
    matchesPhase: boolean,
    matchesScorecard: boolean,
): boolean {
    const matchedCriteria = [
        matchesScorecard ? 'scorecardId' : undefined,
        matchesPhase ? 'phaseId' : undefined,
    ].filter(Boolean) as string[]
    const result = matchedCriteria.length > 0

    debugLog('reviewMatchesPhase.criteria', {
        matchesMetadata: false,
        matchesPhase,
        matchesPhaseName: false,
        matchesScorecard,
        matchesTypeExact: false,
        metadataMatchDetail: undefined,
    })
    debugLog('reviewMatchesPhase.summary', {
        matchedCriteria,
        matchReason: matchedCriteria[0] ?? 'none',
        result,
        reviewId: review.id,
    })

    return result
}

/**
 * Enforces an exact match requirement when the review contains an explicit phase name.
 *
 * @param normalizedPhaseName - Target phase name normalized to lowercase.
 * @param normalizedReviewPhaseName - Review phase name normalized to lowercase.
 * @param review - Review being evaluated.
 * @param reviewPhaseName - Original review phase name for logging purposes.
 * @returns True when the normalized phase names match exactly.
 */
export function enforceExactPhaseNameMatch({
    normalizedPhaseName,
    normalizedReviewPhaseName,
    review,
    reviewPhaseName,
}: {
    normalizedPhaseName: string
    normalizedReviewPhaseName: string
    review: BackendReview
    reviewPhaseName: string
}): boolean {
    const matchesPhaseName = normalizedReviewPhaseName === normalizedPhaseName
    const matchedCriteria = matchesPhaseName ? ['phaseName'] : []

    debugLog('reviewMatchesPhase.phaseNameExactMatchRequired', {
        matchesPhaseName,
        normalizedPhaseName,
        normalizedReviewPhaseName,
        reviewId: review.id,
        reviewPhaseName: truncateForLog(reviewPhaseName),
    })
    debugLog('reviewMatchesPhase.summary', {
        earlyReturnReason: 'phaseNameExactMatchRequired',
        matchedCriteria,
        matchReason: matchedCriteria[0] ?? 'none',
        result: matchesPhaseName,
        reviewId: review.id,
    })

    return matchesPhaseName
}

/**
 * Enforces an exact match requirement when the review contains an explicit review type.
 *
 * @param normalizedPhaseName - Target phase name normalized using separator-insensitive rules.
 * @param normalizedReviewType - Review type normalized using separator-insensitive rules.
 * @param review - Review being evaluated.
 * @param reviewType - Original review type string for logging purposes.
 * @returns True when the normalized review type matches the phase name exactly.
 */
export function enforceExactReviewTypeMatch({
    normalizedPhaseName,
    normalizedReviewType,
    review,
    reviewType,
}: {
    normalizedPhaseName: string
    normalizedReviewType: string
    review: BackendReview
    reviewType: string
}): boolean {
    const matchesReviewType = normalizedReviewType === normalizedPhaseName
    const matchedCriteria = matchesReviewType ? ['reviewType'] : []

    debugLog('reviewMatchesPhase.reviewTypeExactMatchRequired', {
        matchesReviewType,
        normalizedPhaseName,
        normalizedReviewType,
        reviewId: review.id,
        reviewType: truncateForLog(reviewType),
    })
    debugLog('reviewMatchesPhase.summary', {
        earlyReturnReason: 'reviewTypeExactMatchRequired',
        matchedCriteria,
        matchReason: matchedCriteria[0] ?? 'none',
        result: matchesReviewType,
        reviewId: review.id,
    })

    return matchesReviewType
}

/**
 * Determines whether a review matches the supplied phase context by evaluating scorecard,
 * phase identifier, phase name, type, and metadata criteria in priority order.
 *
 * @param review - Review to evaluate.
 * @param scorecardId - Scorecard identifier associated with the target phase.
 * @param phaseIds - Set of phase identifiers collected for the target phase.
 * @param phaseName - Optional phase name for matching when available.
 * @returns True when the review satisfies any of the matching criteria.
 */
export function reviewMatchesPhase(
    review: BackendReview | undefined,
    scorecardId: string | undefined,
    phaseIds: Set<string>,
    phaseName?: string,
): boolean {
    if (!review) {
        logMissingReview(phaseIds, phaseName, scorecardId)
        return false
    }

    const metadataString = normalizeReviewMetadata(review.metadata)
    const reviewPhaseId = resolveReviewPhaseId(review)
    const matchesScorecard = Boolean(scorecardId && review.scorecardId === scorecardId)
    const matchesPhase = Boolean(reviewPhaseId && phaseIds.has(reviewPhaseId))

    debugLog('reviewMatchesPhase.start', {
        matchingStrategy: 'exactPhaseMatching',
        phaseIds: Array.from(phaseIds.values()),
        phaseName,
        reviewId: review.id,
        reviewProperties: {
            metadata: truncateForLog(metadataString),
            phaseId: review.phaseId,
            reviewType: (review as { reviewType?: string | null }).reviewType,
            scorecardId: review.scorecardId,
            typeId: review.typeId,
        },
        scorecardIdBeingChecked: scorecardId,
    })

    const normalizedPhaseName = getNormalizedLowerCase(phaseName)
    const normalizedPhaseNameForReviewType = getNormalizedAlphaLowerCase(phaseName)

    const reviewPhaseName = (review as { phaseName?: string | null }).phaseName ?? undefined
    const normalizedReviewPhaseName = getNormalizedLowerCase(reviewPhaseName)
    const reviewType = (review as { reviewType?: string | null }).reviewType ?? undefined
    const normalizedReviewType = getNormalizedLowerCase(reviewType)
    const normalizedReviewTypeAlpha = getNormalizedAlphaLowerCase(reviewType)

    const phaseBasedMatch = resolvePhaseOrTypeMatch({
        matchesPhase,
        matchesScorecard,
        normalizedPhaseName,
        normalizedPhaseNameForReviewType,
        normalizedReviewPhaseName,
        normalizedReviewTypeAlpha,
        review,
        reviewPhaseName,
        reviewType,
    })

    if (typeof phaseBasedMatch === 'boolean') {
        return phaseBasedMatch
    }

    const reviewTypeId = getNormalizedLowerCase(review.typeId ?? undefined)
    const matchesTypeExact = Boolean(reviewTypeId && reviewTypeId === normalizedPhaseName)
    const metadataMatchDetail: MetadataPhaseMatchDetail = normalizedPhaseName
        ? findMetadataPhaseMatch(
            review.metadata,
            normalizedPhaseName,
        )
        : undefined
    const matchesMetadata = Boolean(metadataMatchDetail)
    const metadataCriteria = buildMetadataCriteria(metadataMatchDetail)
    const matchesReviewTypeName = Boolean(
        normalizedReviewTypeAlpha
        && normalizedPhaseNameForReviewType
        && normalizedReviewTypeAlpha === normalizedPhaseNameForReviewType,
    )

    const matchedCriteria = collectMatchedCriteria({
        matchesPhase,
        matchesReviewTypeName,
        matchesScorecard,
        matchesTypeExact,
        metadataCriteria,
    })

    const result = matchedCriteria.length > 0
    const primaryMatchReason = matchedCriteria[0] ?? 'none'

    debugLog('reviewMatchesPhase.criteria', {
        matchesMetadata,
        matchesPhase,
        matchesPhaseName: false,
        matchesReviewTypeName,
        matchesScorecard,
        matchesTypeExact,
        metadataMatchDetail,
        reviewTypeId,
        reviewTypeName: normalizedReviewType,
        reviewTypeNameAlpha: normalizedReviewTypeAlpha,
    })

    debugLog('reviewMatchesPhase.summary', {
        matchedCriteria,
        matchReason: primaryMatchReason,
        result,
        reviewId: review.id,
    })

    return result
}
