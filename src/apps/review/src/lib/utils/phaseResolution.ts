import type { BackendPhase, BackendReview } from '../models'

import { metadataMatchesPhase } from './metadataMatching'
import {
    parseReviewMetadataObject,
    type ReviewerPhaseConfig,
} from './reviewMetadataParsing'
import { debugLog } from './screeningReviewDebug'

/**
 * Util for resolving phase IDs and phase metadata including scorecard IDs for review phases.
 */

/**
 * Collects the phase identifiers that correspond to a given phase name.
 * @param phases - Collection of backend phases associated with the challenge.
 * @param reviewers - Reviewer configuration that may reference phase identifiers.
 * @param phaseName - Phase display name to match.
 * @returns Set of phase identifiers matching the provided name.
 */
export function collectPhaseIdsForName(
    phases: BackendPhase[] | undefined,
    reviewers: ReviewerPhaseConfig[] | undefined,
    phaseName: string,
): Set<string> {
    const normalizedPhaseName = phaseName.toLowerCase()
    const ids = new Set<string>()

    phases?.forEach(phase => {
        if ((phase.name || '').toLowerCase() === normalizedPhaseName) {
            if (phase.phaseId) {
                ids.add(`${phase.phaseId}`)
            }

            if (phase.id) {
                ids.add(`${phase.id}`)
            }
        }
    })

    reviewers?.forEach(reviewer => {
        const matchesType = (reviewer.type || '').toLowerCase() === normalizedPhaseName
        const hasPhaseId = reviewer.phaseId !== undefined && reviewer.phaseId !== null
        if (matchesType && hasPhaseId) {
            ids.add(`${reviewer.phaseId}`)
        }
    })

    return ids
}

/**
 * Resolves phase metadata for the supplied phase by gathering candidate phase IDs and locating
 * the scorecard associated with the phase. Resolution prioritizes, in order: an existing review,
 * reviewer configuration, explicit phase constraints, legacy scorecard IDs, and finally
 * metadata/type fallbacks.
 *
 * @param phaseName - Phase display name to resolve.
 * @param phases - Collection of backend phases associated with the challenge.
 * @param reviewers - Reviewer configuration that may reference phase identifiers.
 * @param reviews - Existing reviews that may contain phase and scorecard information.
 * @param legacyScorecardId - Optional scorecard identifier supplied by earlier APIs.
 * @returns Resolved scorecard identifier (when found) and the set of associated phase IDs.
 */
export function resolvePhaseMeta(
    phaseName: string,
    phases: BackendPhase[] | undefined,
    reviewers: ReviewerPhaseConfig[] | undefined,
    reviews: BackendReview[] | undefined,
    legacyScorecardId?: string | number,
): { scorecardId?: string; phaseIds: Set<string> } {
    const normalizedPhaseName = phaseName.toLowerCase()
    const phaseIds = collectPhaseIdsForName(phases, reviewers, phaseName)

    const matchingPhases = phases?.filter(
        phase => (phase.name || '').toLowerCase() === normalizedPhaseName,
    ) ?? []

    const matchingReviewers = reviewers?.filter(reviewer => (
        (reviewer.type || '').toLowerCase() === normalizedPhaseName
    )) ?? []

    const logResolution = (
        source: string,
        resolvedScorecardId: string | undefined,
        extra: Record<string, unknown> = {},
    ): void => {
        debugLog('resolvePhaseMeta', {
            legacyScorecardId: legacyScorecardId ? `${legacyScorecardId}` : undefined,
            matchingPhaseCount: matchingPhases.length,
            matchingReviewerCount: matchingReviewers.length,
            phaseIds: Array.from(phaseIds.values()),
            phaseName,
            resolvedScorecardId,
            scorecardSource: source,
            ...extra,
        })
    }

    matchingPhases.forEach(phase => {
        if (phase.phaseId) {
            phaseIds.add(`${phase.phaseId}`)
        }

        if (phase.id) {
            phaseIds.add(`${phase.id}`)
        }
    })

    const reviewMatch = reviews?.find(review => {
        if (!review?.scorecardId) {
            return false
        }

        const reviewPhaseId = review.phaseId ? `${review.phaseId}` : undefined
        if (!reviewPhaseId) {
            return false
        }

        const matchesKnownPhase = phaseIds.has(reviewPhaseId)
            || matchingPhases.some(
                phase => `${phase.phaseId}` === reviewPhaseId || `${phase.id}` === reviewPhaseId,
            )

        if (matchesKnownPhase) {
            phaseIds.add(reviewPhaseId)
            return true
        }

        const reviewerTypeMatch = reviewers?.some(reviewer => {
            const reviewerPhaseId = reviewer.phaseId !== undefined && reviewer.phaseId !== null
                ? `${reviewer.phaseId}`
                : undefined
            const matchesType = (reviewer.type || '').toLowerCase() === normalizedPhaseName
            return matchesType && (!reviewerPhaseId || reviewerPhaseId === reviewPhaseId)
        })

        if (reviewerTypeMatch) {
            phaseIds.add(reviewPhaseId)
            return true
        }

        if (legacyScorecardId && `${legacyScorecardId}` === review.scorecardId) {
            phaseIds.add(reviewPhaseId)
            return true
        }

        return false
    })

    if (reviewMatch?.scorecardId) {
        logResolution('reviewMatch', reviewMatch.scorecardId, {
            matchedReviewId: reviewMatch.id,
            matchedReviewPhaseId: reviewMatch.phaseId,
        })
        return { phaseIds, scorecardId: reviewMatch.scorecardId }
    }

    const reviewerMatch = reviewers?.find(reviewer => {
        if (!reviewer?.scorecardId) {
            return false
        }

        const reviewerPhaseId = reviewer.phaseId !== undefined && reviewer.phaseId !== null
            ? `${reviewer.phaseId}`
            : undefined
        if (reviewerPhaseId) {
            phaseIds.add(reviewerPhaseId)
        }

        return (reviewer.type || '').toLowerCase() === normalizedPhaseName
            || (reviewerPhaseId ? phaseIds.has(reviewerPhaseId) : false)
    })

    if (reviewerMatch?.scorecardId) {
        logResolution('reviewerMatch', reviewerMatch.scorecardId, {
            matchedReviewer: reviewerMatch,
        })
        return { phaseIds, scorecardId: reviewerMatch.scorecardId }
    }

    const constraintValue = matchingPhases
        .map(phase => phase.constraints?.find(constraint => constraint.name === 'Scorecard')?.value)
        .find(value => value !== undefined && value !== null)

    if (constraintValue) {
        const scorecardId = `${constraintValue}`
        logResolution('phaseConstraint', scorecardId)
        return { phaseIds, scorecardId }
    }

    if (legacyScorecardId) {
        const scorecardId = `${legacyScorecardId}`
        logResolution('legacyScorecard', scorecardId)
        return { phaseIds, scorecardId }
    }

    let fallbackMetadataKeys: string[] | undefined

    const fallbackReviewWithScorecard = reviews?.find(review => {
        if (!review?.scorecardId) return false
        const reviewType = (review.typeId || '').trim()
            .toLowerCase()
        const typeMatches = reviewType === normalizedPhaseName
        const metadataObject = parseReviewMetadataObject(review.metadata)
        const metaMatches = metadataMatchesPhase(review.metadata, normalizedPhaseName)

        if (metaMatches) {
            fallbackMetadataKeys = metadataObject
                ? Object.keys(metadataObject)
                : (typeof review.metadata === 'string' ? ['<string>'] : undefined)
        }

        const accept = typeMatches || metaMatches
        if (accept && review.phaseId) {
            phaseIds.add(`${review.phaseId}`)
        }

        return accept
    })

    if (fallbackReviewWithScorecard?.scorecardId) {
        logResolution('fallbackReview', fallbackReviewWithScorecard.scorecardId, {
            matchedReviewId: fallbackReviewWithScorecard.id,
            matchedReviewPhaseId: fallbackReviewWithScorecard.phaseId,
            metadataKeys: fallbackMetadataKeys,
        })
        return { phaseIds, scorecardId: fallbackReviewWithScorecard.scorecardId }
    }

    logResolution('noScorecardResolved', undefined)
    return { phaseIds }
}
