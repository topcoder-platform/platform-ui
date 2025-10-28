import type { AggregatedReviewDetail, SubmissionRow } from './types'

export type ReviewOutcome = 'PASS' | 'FAIL'

const PASS_KEYWORDS = new Set([
    'PASS',
    'PASSED',
    'PASSING',
])

const FAIL_KEYWORDS = new Set([
    'FAIL',
    'FAILED',
    'NO PASS',
    'NOPASS',
    'NO-PASS',
    'NOT PASS',
    'NOT-PASS',
    'REJECT',
    'REJECTED',
])

const MINIMUM_PASSING_SCORE_KEYS = [
    'minimumPassingScore',
    'passingScore',
    'minScore',
    'minimumScore',
    'passScore',
]

const OUTCOME_KEYS = [
    'outcome',
    'result',
    'status',
    'reviewOutcome',
    'reviewResult',
]

type MetadataObject = Record<string, unknown>

const COMPLETED_REVIEW_STATUSES = new Set(['COMPLETED', 'SUBMITTED'])

const normalizeStatusString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
        return undefined
    }

    const normalized = value.trim()
        .toUpperCase()
    return normalized.length ? normalized : undefined
}

const isAggregatedReviewDetailCompleted = (detail: AggregatedReviewDetail): boolean => {
    const statusCandidates = [
        detail.status,
        detail.reviewInfo?.status,
    ]

    for (const candidate of statusCandidates) {
        const normalized = normalizeStatusString(candidate)
        if (normalized) {
            return COMPLETED_REVIEW_STATUSES.has(normalized)
        }
    }

    const committedCandidates = [
        detail.reviewInfo?.committed,
    ]

    if (committedCandidates.some(value => value === false)) {
        return false
    }

    if (committedCandidates.some(value => value === true)) {
        return true
    }

    const finalScoreCandidates = [
        detail.finalScore,
        detail.reviewInfo?.finalScore,
    ]

    return finalScoreCandidates.some(value => typeof value === 'number' && Number.isFinite(value))
}

const shouldDeferAggregatedOutcome = (submission: SubmissionRow): boolean => {
    const aggregatedReviews = submission.aggregated?.reviews
    if (!aggregatedReviews || aggregatedReviews.length === 0) {
        return false
    }

    const assignedReviews = aggregatedReviews.filter(review => (
        Boolean(review.resourceId)
        || Boolean(review.reviewInfo?.resourceId)
        || Boolean(review.reviewId)
        || Boolean(review.reviewerHandle ?? review.reviewInfo?.reviewerHandle)
    ))

    if (assignedReviews.length <= 1) {
        return false
    }

    return !assignedReviews.every(isAggregatedReviewDetailCompleted)
}

const isRecord = (value: unknown): value is MetadataObject => (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
)

const toFiniteNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) {
            return undefined
        }

        const parsed = Number.parseFloat(trimmed)
        return Number.isFinite(parsed) ? parsed : undefined
    }

    return undefined
}

const parseMetadataCandidate = (metadata: unknown): MetadataObject | undefined => {
    if (isRecord(metadata)) {
        return metadata
    }

    if (typeof metadata === 'string' && metadata.trim()) {
        try {
            const parsed = JSON.parse(metadata)
            return isRecord(parsed) ? parsed : undefined
        } catch {
            return undefined
        }
    }

    return undefined
}

const normalizeOutcomeString = (value: string): ReviewOutcome | undefined => {
    const normalized = value.trim()
        .toUpperCase()

    if (!normalized) {
        return undefined
    }

    if (PASS_KEYWORDS.has(normalized)) {
        return 'PASS'
    }

    if (FAIL_KEYWORDS.has(normalized)) {
        return 'FAIL'
    }

    const collapsed = normalized.replace(/\s+/g, ' ')
    if (PASS_KEYWORDS.has(collapsed)) {
        return 'PASS'
    }

    if (FAIL_KEYWORDS.has(collapsed)) {
        return 'FAIL'
    }

    return undefined
}

/* eslint-disable complexity, no-continue */
const extractOutcomeFromMetadata = (metadata: unknown): ReviewOutcome | undefined => {
    if (typeof metadata === 'string') {
        const normalized = normalizeOutcomeString(metadata)
        if (normalized) {
            return normalized
        }
    }

    const root = parseMetadataCandidate(metadata)
    if (!root) {
        return undefined
    }

    const visited = new Set<unknown>()
    const queue: unknown[] = [root]

    while (queue.length) {
        const current = queue.shift()
        if (!current) {
            continue
        }

        if (visited.has(current)) {
            continue
        }

        visited.add(current)

        if (Array.isArray(current)) {
            current.forEach(item => queue.push(item))
            continue
        }

        if (!isRecord(current)) {
            continue
        }

        for (const key of Object.keys(current)) {
            const value = current[key]

            if (OUTCOME_KEYS.includes(key)) {
                if (typeof value === 'string') {
                    const normalized = normalizeOutcomeString(value)
                    if (normalized) {
                        return normalized
                    }
                }
            }

            if (value && typeof value === 'object') {
                queue.push(value)
            }
        }
    }

    return undefined
}

const extractMinimumPassingScoreFromMetadata = (metadata: unknown): number | undefined => {
    const root = parseMetadataCandidate(metadata)
    if (!root) {
        return undefined
    }

    const visited = new Set<unknown>()
    const queue: unknown[] = [root]

    while (queue.length) {
        const current = queue.shift()
        if (!current) {
            continue
        }

        if (visited.has(current)) {
            continue
        }

        visited.add(current)

        if (Array.isArray(current)) {
            current.forEach(item => queue.push(item))
            continue
        }

        if (!isRecord(current)) {
            continue
        }

        for (const key of Object.keys(current)) {
            const value = current[key]

            if (MINIMUM_PASSING_SCORE_KEYS.includes(key)) {
                const numeric = toFiniteNumber(value)
                if (numeric !== undefined) {
                    return numeric
                }
            }

            if (value && typeof value === 'object') {
                queue.push(value)
            }
        }
    }

    return undefined
}
/* eslint-enable complexity, no-continue */

const resolveReviewScore = (submission: SubmissionRow): number | undefined => {
    const aggregatedAverage = submission.aggregated?.averageFinalScore
    if (typeof aggregatedAverage === 'number' && Number.isFinite(aggregatedAverage)) {
        return aggregatedAverage
    }

    const aggregateScore = submission.aggregateScore
    if (typeof aggregateScore === 'number' && Number.isFinite(aggregateScore)) {
        return aggregateScore
    }

    const reviewFinalScore = submission.review?.finalScore
    if (typeof reviewFinalScore === 'number' && Number.isFinite(reviewFinalScore)) {
        return reviewFinalScore
    }

    const reviewInitialScore = submission.review?.initialScore
    if (typeof reviewInitialScore === 'number' && Number.isFinite(reviewInitialScore)) {
        return reviewInitialScore
    }

    return undefined
}

const collectMetadataCandidates = (submission: SubmissionRow): unknown[] => {
    const candidates: unknown[] = []

    if (submission.review?.metadata) {
        candidates.push(submission.review.metadata)
    }

    submission.aggregated?.reviews?.forEach(reviewDetail => {
        const metadata = reviewDetail.reviewInfo?.metadata
        if (metadata) {
            candidates.push(metadata)
        }
    })

    return candidates
}

const normalizeScorecardId = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmed = value.trim()
    return trimmed.length ? trimmed : undefined
}

const collectScorecardIds = (submission: SubmissionRow): string[] => {
    const ids = new Set<string>()

    const primary = normalizeScorecardId(submission.review?.scorecardId)
    if (primary) {
        ids.add(primary)
    }

    submission.aggregated?.reviews?.forEach(review => {
        const derived = normalizeScorecardId(review.reviewInfo?.scorecardId)
        if (derived) {
            ids.add(derived)
        }
    })

    return Array.from(ids)
}

const resolvePassingScoreFromMap = (
    submission: SubmissionRow,
    map: Map<string, number | undefined> | undefined,
): number | undefined => {
    if (!map || !map.size) {
        return undefined
    }

    const ids = collectScorecardIds(submission)
    for (const id of ids) {
        const value = map.get(id)
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value
        }
    }

    return undefined
}

export interface ResolveSubmissionReviewResultOptions {
    minimumPassingScoreByScorecardId?: Map<string, number | undefined>
    defaultMinimumPassingScore?: number
}

export function resolveSubmissionReviewResult(
    submission: SubmissionRow,
    options: ResolveSubmissionReviewResultOptions = {},
): ReviewOutcome | undefined {
    const {
        minimumPassingScoreByScorecardId,
        defaultMinimumPassingScore,
    }: ResolveSubmissionReviewResultOptions = options

    if (shouldDeferAggregatedOutcome(submission)) {
        return undefined
    }

    const metadataCandidates = collectMetadataCandidates(submission)

    const metadataOutcome = metadataCandidates
        .map(candidate => extractOutcomeFromMetadata(candidate))
        .find((value): value is ReviewOutcome => Boolean(value))

    const metadataMinimumPassingScore = metadataCandidates
        .map(candidate => extractMinimumPassingScoreFromMetadata(candidate))
        .find((value): value is number => typeof value === 'number')

    const mapMinimumPassingScore = resolvePassingScoreFromMap(
        submission,
        minimumPassingScoreByScorecardId,
    )

    const minimumPassingScore = metadataMinimumPassingScore
        ?? mapMinimumPassingScore
        ?? defaultMinimumPassingScore

    const reviewScore = resolveReviewScore(submission)

    const scoreOutcome: ReviewOutcome | undefined = (
        typeof minimumPassingScore === 'number'
        && typeof reviewScore === 'number'
    )
        ? (reviewScore >= minimumPassingScore ? 'PASS' : 'FAIL')
        : undefined

    if (submission.isPassingReview === true) {
        return 'PASS'
    }

    if (submission.isPassingReview === false) {
        return 'FAIL'
    }

    if (metadataOutcome === 'FAIL') {
        return 'FAIL'
    }

    if (scoreOutcome === 'PASS') {
        return 'PASS'
    }

    if (scoreOutcome === 'FAIL') {
        return metadataOutcome === 'PASS' ? 'PASS' : 'FAIL'
    }

    if (metadataOutcome) {
        return metadataOutcome
    }

    return scoreOutcome
}
