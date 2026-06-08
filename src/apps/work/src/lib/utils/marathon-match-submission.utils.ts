import {
    ReviewSummation,
    Submission,
} from '../models'

export type MarathonMatchTestType = 'provisional' | 'system'
export type MarathonMatchTestTypeFilter = 'all' | MarathonMatchTestType

const TEST_TYPE_ORDER: Record<MarathonMatchTestType, number> = {
    provisional: 0,
    system: 1,
}

/**
 * Converts an optional value to trimmed text for metadata comparisons.
 *
 * @param value raw metadata or review summation field value.
 * @returns trimmed string, or an empty string for nullish values.
 */
function normalizeText(value: unknown): string {
    if (value === undefined || value === null) {
        return ''
    }

    return String(value)
        .trim()
}

/**
 * Normalizes a Marathon Match phase token for loose comparisons.
 *
 * @param value raw metadata test type, process, or stage value.
 * @returns lowercase token with separators removed.
 */
function normalizeToken(value: unknown): string {
    return normalizeText(value)
        .toLowerCase()
        .replace(/[_\s-]+/g, '')
}

/**
 * Converts boolean-like metadata values into booleans.
 *
 * @param value raw metadata flag value.
 * @returns boolean when the value is a boolean or boolean string, otherwise `undefined`.
 */
function normalizeBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
        return value
    }

    const normalizedValue = normalizeText(value)
        .toLowerCase()

    if (normalizedValue === 'true') {
        return true
    }

    if (normalizedValue === 'false') {
        return false
    }

    return undefined
}

/**
 * Resolves the Marathon Match test type represented by a review summation.
 *
 * @param reviewSummation Review summation returned with a submission.
 * @returns `provisional` or `system` when metadata or review flags identify the phase,
 * otherwise `undefined`.
 */
export function getReviewSummationMarathonTestType(
    reviewSummation: ReviewSummation,
): MarathonMatchTestType | undefined {
    const metadata = reviewSummation.metadata
    const normalizedTestType = normalizeToken(metadata?.testType)
        || normalizeToken(metadata?.testProcess)

    if (normalizedTestType === 'system' || normalizedTestType === 'final') {
        return 'system'
    }

    if (normalizedTestType === 'provisional') {
        return 'provisional'
    }

    if (
        reviewSummation.isFinal === true
        || normalizeBoolean(metadata?.isFinal) === true
    ) {
        return 'system'
    }

    if (
        reviewSummation.isProvisional === true
        || normalizeBoolean(metadata?.isProvisional) === true
    ) {
        return 'provisional'
    }

    return undefined
}

/**
 * Returns the review summations that match the requested Marathon Match test type filter.
 *
 * @param submission Submission whose review summations should be inspected.
 * @param testTypeFilter Selected filter from the submissions table controls.
 * @returns Matching provisional/system summations in stable display order.
 */
export function getSubmissionMarathonTestSummations(
    submission: Pick<Submission, 'reviewSummation'>,
    testTypeFilter: MarathonMatchTestTypeFilter = 'all',
): ReviewSummation[] {
    const reviewSummations = Array.isArray(submission.reviewSummation)
        ? submission.reviewSummation
        : []

    return reviewSummations
        .filter(reviewSummation => {
            const testType = getReviewSummationMarathonTestType(reviewSummation)

            return testTypeFilter === 'all'
                ? testType !== undefined
                : testType === testTypeFilter
        })
        .sort((left, right) => {
            const leftType = getReviewSummationMarathonTestType(left)
            const rightType = getReviewSummationMarathonTestType(right)

            if (!leftType || !rightType) {
                return 0
            }

            return TEST_TYPE_ORDER[leftType] - TEST_TYPE_ORDER[rightType]
        })
}

/**
 * Checks whether a submission should remain visible for a Marathon Match test type filter.
 *
 * @param submission Submission whose review summations should be inspected.
 * @param testTypeFilter Selected filter from the submissions table controls.
 * @returns `true` when the filter is `all` or the submission has a matching phase summation.
 */
export function matchesSubmissionMarathonTestTypeFilter(
    submission: Pick<Submission, 'reviewSummation'>,
    testTypeFilter: MarathonMatchTestTypeFilter,
): boolean {
    return testTypeFilter === 'all'
        || getSubmissionMarathonTestSummations(submission, testTypeFilter).length > 0
}
