import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

import { BackendResource } from './BackendResource.model'
import type { BackendReview } from './BackendReview.model'
import { BackendSubmission } from './BackendSubmission.model'
import { BackendSubmissionStatus } from './BackendSubmissionStatus.enum'
import {
    adjustReviewInfo,
    convertBackendReviewToReviewInfo,
    ReviewInfo,
} from './ReviewInfo.model'
import {
    convertBackendReviewToReviewResult,
    ReviewResult,
} from './ReviewResult.model'

/**
 * Challenge submission info
 */
export interface SubmissionInfo {
    id: string
    /**
     * Legacy submission identifier used by older review payloads and result lookups.
     */
    legacySubmissionId?: string
    memberId: string
    /**
     * Placement assigned to the submission when available from the backend.
     */
    placement?: number | null
    /**
     * Submitter handle returned by the submissions API for legacy winner matching.
     */
    submitterHandle?: string
    userInfo?: BackendResource // this field is calculated at frontend
    review?: ReviewInfo
    reviewInfos?: ReviewInfo[]
    reviews?: ReviewResult[]
    /**
     * Backend review type identifier (e.g. 'Post-Mortem Review').
     */
    reviewTypeId?: string
    /**
     * Aggregated final score from review summations when available.
     */
    aggregateScore?: number
    /**
     * Aggregated system/final score from review summations when available.
     */
    finalAggregateScore?: number
    /**
     * Indicates whether the latest review summation meets the passing threshold.
     */
    isPassingReview?: boolean
    /**
     * The date/time when the submission was created.
     */
    submittedDate?: string | Date
    /**
     * Localized string for the submitted date, computed on frontend.
     */
    submittedDateString?: string
    /**
     * Virus scan status (true when scan passed, false when failed).
     */
    virusScan?: boolean
    /**
     * Indicates whether this submission is the latest for the member.
     */
    isLatest?: boolean
    /**
     * Submission type (e.g. CONTEST_SUBMISSION, CHECKPOINT_SUBMISSION).
     */
    type?: string
    /**
     * Flag indicating whether the submission includes an uploaded file.
     */
    isFileSubmission?: boolean
    /**
     * Submission status (e.g. 'ACTIVE', 'FAILED_REVIEW', 'AI_FAILED_REVIEW').
     */
    status?: string
}

/**
 * Normalize backend submission status to string representation
 * @param status - The status value from backend (can be number or string)
 * @returns Normalized status string
 */
function normalizeSubmissionStatus(status: BackendSubmissionStatus | string | undefined): string | undefined {
    if (typeof status === 'number') {
        return BackendSubmissionStatus[status] ?? String(status)
    }

    if (typeof status === 'string') {
        return status
    }

    return undefined
}

type ReviewSummationLike = {
    aggregateScore?: unknown
    createdAt?: unknown
    isFinal?: unknown
    isPassing?: unknown
    metadata?: unknown
    reviewedDate?: unknown
    updatedAt?: unknown
}

/**
 * Parses boolean-like review summation flags from Review API payloads.
 *
 * @param value - Raw flag value from a summation row or metadata object.
 * @returns Parsed boolean, or undefined when the value is not boolean-like.
 * Used while selecting final/system Marathon Match summations for display.
 */
function parseBooleanFlag(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'string') {
        const normalized = value.trim()
            .toLowerCase()
        if (normalized === 'true') {
            return true
        }

        if (normalized === 'false') {
            return false
        }
    }

    return undefined
}

/**
 * Parses Review API summation metadata into an object.
 *
 * @param metadata - Raw metadata value, which may be an object or JSON string.
 * @returns Metadata record, or an empty object when metadata is absent or malformed.
 * Used for Marathon Match phase classification; malformed JSON is ignored.
 */
function parseSummationMetadata(metadata: unknown): Record<string, unknown> {
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
        return metadata as Record<string, unknown>
    }

    if (typeof metadata === 'string' && metadata.trim()) {
        try {
            const parsed = JSON.parse(metadata)
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                ? parsed as Record<string, unknown>
                : {}
        } catch {
            return {}
        }
    }

    return {}
}

/**
 * Normalizes Marathon Match scoring phase labels from summation metadata.
 *
 * @param value - Raw phase value such as testProcess or testType.
 * @returns Normalized phase, or undefined when the value is not recognized.
 * Used to treat metadata-only SYSTEM summations as final scores.
 */
function normalizeSummationPhase(value: unknown): 'example' | 'provisional' | 'system' | undefined {
    const normalized = typeof value === 'string'
        ? value.trim()
            .toLowerCase()
        : ''

    if (normalized === 'system' || normalized === 'final') {
        return 'system'
    }

    if (normalized === 'provisional') {
        return 'provisional'
    }

    if (normalized === 'example') {
        return 'example'
    }

    return undefined
}

/**
 * Parses a finite aggregate score from a review summation.
 *
 * @param value - Raw aggregate score from Review API.
 * @returns Numeric aggregate score, or undefined when not finite.
 * Used by submission conversion before exposing score fields to tables.
 */
function parseAggregateScore(value: unknown): number | undefined {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined
    }

    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value)
        return Number.isFinite(parsed) ? parsed : undefined
    }

    return undefined
}

/**
 * Resolves the best timestamp available for ordering review summations.
 *
 * @param summation - Review summation returned by Review API.
 * @returns Epoch milliseconds, or 0 when no parseable timestamp exists.
 * Used to prefer the newest final/system Marathon Match score.
 */
function getSummationTimestamp(summation: ReviewSummationLike): number {
    const rawTimestamp = summation.updatedAt
        ?? summation.reviewedDate
        ?? summation.createdAt
    const timestamp = typeof rawTimestamp === 'string' ? Date.parse(rawTimestamp) : Number.NaN

    return Number.isFinite(timestamp) ? timestamp : 0
}

/**
 * Determines whether a summation represents Marathon Match system/final scoring.
 *
 * @param summation - Review summation returned by Review API.
 * @returns True when flags or metadata identify the summation as final/system.
 * Used so provisional scores do not drive the Winners tab final score.
 */
function isFinalReviewSummation(summation: ReviewSummationLike): boolean {
    const metadata = parseSummationMetadata(summation.metadata)
    const phase = normalizeSummationPhase(
        metadata.testProcess ?? metadata.testType,
    )
    const stage = typeof metadata.stage === 'string'
        ? metadata.stage.trim()
            .toLowerCase()
        : ''

    return parseBooleanFlag(summation.isFinal) === true
        || parseBooleanFlag(metadata.isFinal) === true
        || phase === 'system'
        || stage === 'final'
}

/**
 * Selects the newest final/system review summation with a usable score.
 *
 * @param reviewSummations - Summations attached to one submission.
 * @returns Preferred final/system summation, or undefined when none exist.
 * Used to populate final-only aggregate scores for Marathon Match winners.
 */
function findFinalReviewSummation(
    reviewSummations: ReviewSummationLike[],
): ReviewSummationLike | undefined {
    return reviewSummations
        .map((summation, index) => ({
            index,
            score: parseAggregateScore(summation.aggregateScore),
            summation,
            timestamp: getSummationTimestamp(summation),
        }))
        .filter(item => item.score !== undefined && isFinalReviewSummation(item.summation))
        .sort((first, second) => (
            second.timestamp - first.timestamp
            || second.index - first.index
        ))[0]?.summation
}

/**
 * Normalizes a backend submission identifier candidate.
 *
 * @param value - Raw identifier value from a submission or review payload.
 * @returns Trimmed identifier text, or undefined when the candidate is empty.
 * Used when Review API omits the top-level submission id for reviewer-visible
 * rows but still includes the review assignment's submissionId.
 */
function normalizeSubmissionIdentifier(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalized = `${value}`.trim()
    return normalized.length ? normalized : undefined
}

/**
 * Resolves the modern submission id for a backend submission payload.
 *
 * @param data - Backend submission payload returned by Review API.
 * @param reviewEntries - Review assignments attached to the submission.
 * @returns The top-level submission id, or the first review submissionId
 * fallback when the top-level id is omitted.
 * Used by review tables so pending reviewer assignments remain renderable.
 */
function resolveSubmissionInfoId(
    data: BackendSubmission,
    reviewEntries: BackendReview[],
): string {
    return normalizeSubmissionIdentifier(data.id)
        ?? reviewEntries
            .map(review => normalizeSubmissionIdentifier(review?.submissionId))
            .find((submissionId): submissionId is string => Boolean(submissionId))
        ?? ''
}

/**
 * Update review info to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustSubmissionInfo(
    data: SubmissionInfo | undefined,
): SubmissionInfo | undefined {
    if (!data) {
        return data
    }

    return {
        ...data,
        review: data.review ? adjustReviewInfo(data.review) : undefined,
    }
}

/**
 * Convert backend submission info to show in review table
 *
 * @param data data from backend response
 * @returns updated data
 */
export function convertBackendSubmissionToSubmissionInfo(
    data: BackendSubmission,
    registrants?: BackendResource[] | undefined,
): SubmissionInfo {
    const submittedDate = data.submittedDate ? new Date(data.submittedDate) : undefined
    const submittedDateString = submittedDate
        ? moment(submittedDate)
            .local()
            .format(TABLE_DATE_FORMAT)
        : undefined
    const reviewSummations: ReviewSummationLike[] = Array.isArray(data.reviewSummation)
        ? data.reviewSummation
        : []
    const finalSummation = findFinalReviewSummation(reviewSummations)
    const preferredSummation = finalSummation ?? reviewSummations[0]
    const aggregateScore = parseAggregateScore(preferredSummation?.aggregateScore)
    const finalAggregateScore = parseAggregateScore(finalSummation?.aggregateScore)
    const isPassingReviewRaw = preferredSummation?.isPassing
    const isPassingReview = typeof isPassingReviewRaw === 'boolean'
        ? isPassingReviewRaw
        : undefined
    const reviewEntries = Array.isArray(data.review) ? data.review : []
    const submissionId = resolveSubmissionInfoId(data, reviewEntries)
    const reviewInfos = reviewEntries.map(convertBackendReviewToReviewInfo)
    const reviewResults = reviewEntries.map(convertBackendReviewToReviewResult)
    const primaryReviewInfo = reviewInfos[0]
    const primaryReview = reviewEntries[0]

    const registrantMap = new Map<string, BackendResource>()
    if (Array.isArray(registrants)) {
        registrants.forEach(r => {
            if (r?.memberId !== undefined && r?.memberId !== null) {
                registrantMap.set(String(r.memberId), r)
            }
        })
    }

    return {
        aggregateScore,
        finalAggregateScore,
        id: submissionId,
        isFileSubmission: data.isFileSubmission,
        isLatest: data.isLatest,
        isPassingReview,
        legacySubmissionId: data.legacySubmissionId,
        memberId: data.memberId,
        placement: data.placement,
        review: primaryReviewInfo,
        reviewInfos,
        reviews: reviewResults,
        reviewTypeId: primaryReview?.typeId ?? undefined,
        status: normalizeSubmissionStatus(data.status),
        submittedDate,
        submittedDateString,
        submitterHandle: (data as BackendSubmission & {
            submitterHandle?: string | null
        }).submitterHandle?.trim() || undefined,
        type: data.type,
        userInfo: registrantMap.get(data.memberId),
        virusScan: data.virusScan,
    }
}
