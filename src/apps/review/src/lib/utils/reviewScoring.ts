/**
 * Util for extracting, parsing, and formatting review scores and outcomes.
 */
import { getRatingColor } from '~/libs/core'

import type { BackendResource, BackendReview, Screening } from '../models'

import {
    extractOutcomeFromMetadata,
    parseFiniteNumber,
    parseReviewMetadataObject,
} from './reviewMetadataParsing'

/**
 * Extracts a numeric score from a review, prioritising explicit fields before metadata.
 *
 * @param review - Review containing the potential score information.
 * @returns The first finite numeric score found, or undefined when unavailable.
 */
export function getNumericScore(review: BackendReview | undefined): number | undefined {
    if (!review) {
        return undefined
    }

    const finalScore = parseFiniteNumber(review.finalScore)
    if (finalScore !== undefined) {
        return finalScore
    }

    const initialScore = parseFiniteNumber(review.initialScore)
    if (initialScore !== undefined) {
        return initialScore
    }

    const metadataObject = parseReviewMetadataObject(review.metadata)
    if (metadataObject) {
        const metadataScoreKeys = ['score', 'aggregateScore', 'finalScore', 'initialScore', 'rawScore']
        for (const key of metadataScoreKeys) {
            const parsed = parseFiniteNumber(metadataObject[key])
            if (parsed !== undefined) {
                return parsed
            }
        }
    }

    return undefined
}

/**
 * Parses the submission score string into a finite number when possible.
 *
 * @param score - Submission score string.
 * @returns The parsed number or undefined if the input is not finite.
 */
export function parseSubmissionScore(score: string | null | undefined): number | undefined {
    if (score === undefined || score === null) {
        return undefined
    }

    const parsedScore = Number(score)
    return Number.isFinite(parsedScore) ? parsedScore : undefined
}

/**
 * Converts a numeric score into a display string with sensible fallbacks.
 *
 * @param numericScore - Score already parsed into a number.
 * @param fallback - Fallback string to use when the numeric score is unavailable.
 * @returns A string suitable for display in the UI.
 */
export function scoreToDisplay(numericScore: number | undefined, fallback: string | undefined): string {
    if (typeof numericScore === 'number') {
        return numericScore.toFixed(2)
    }

    return fallback ?? 'Pending'
}

/**
 * Determines the pass/fail result for a review given scores, thresholds, and metadata.
 *
 * @param numericScore - Parsed numeric score for the review.
 * @param minPass - Minimum passing score threshold.
 * @param baseResult - Existing screening result provided by the backend.
 * @param metadata - Additional metadata that may contain outcome information.
 * @returns The resolved screening result.
 */
export function determinePassFail(
    numericScore: number | undefined,
    minPass: number | null | undefined,
    baseResult: Screening['result'],
    metadata?: BackendReview['metadata'],
): Screening['result'] {
    if (typeof numericScore === 'number' && typeof minPass === 'number') {
        return numericScore >= minPass ? 'PASS' : 'NO PASS'
    }

    const metadataOutcome = metadata !== undefined
        ? extractOutcomeFromMetadata(metadata)
        : undefined
    if (metadataOutcome) {
        const normalized = metadataOutcome.toUpperCase()
        if (normalized === 'PASS' || normalized === 'NO PASS') {
            return normalized as Screening['result']
        }
    }

    if (baseResult) {
        const normalizedBase = baseResult.toUpperCase()
        if (normalizedBase === 'PASS' || normalizedBase === 'NO PASS') {
            return normalizedBase as Screening['result']
        }
    }

    return baseResult
}

/**
 * Builds a backend resource representation from the reviewer's handle and rating.
 *
 * @param review - Review containing reviewer data.
 * @returns A backend resource with handle metadata, or undefined when unavailable.
 */
export function buildResourceFromReviewHandle(review: BackendReview | undefined): BackendResource | undefined {
    if (!review?.reviewerHandle) {
        return undefined
    }

    const rating = typeof review.reviewerMaxRating === 'number'
        ? review.reviewerMaxRating
        : undefined

    return {
        handleColor: getRatingColor(rating),
        memberHandle: review.reviewerHandle,
    } as BackendResource
}
