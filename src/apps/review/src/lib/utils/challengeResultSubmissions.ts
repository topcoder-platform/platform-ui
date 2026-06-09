import type { BackendResource, SubmissionInfo } from '../models'

export interface BuildChallengeResultSubmissionSourceArgs {
    challengeSubmissions?: SubmissionInfo[]
    memberMapping: Record<string, BackendResource | undefined>
    reviewSubmissions?: SubmissionInfo[]
    winnerSubmissions?: SubmissionInfo[]
}

/**
 * Normalizes identifier-like values for submission-source matching.
 *
 * @param value - Raw identifier value.
 * @returns Trimmed string identifier or undefined when empty.
 */
function normalizeIdentifier(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalized = `${value}`.trim()
    return normalized.length ? normalized : undefined
}

/**
 * Returns a finite number when the value is already numeric and usable.
 *
 * @param value - Numeric candidate from a normalized submission.
 * @returns Finite number, or undefined when absent or invalid.
 * Used by winner score resolution before calculating fallback review averages.
 */
function toFiniteNumber(value?: number | null): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/**
 * Resolves the final score candidate for a winner submission.
 *
 * @param submission - Submission being evaluated for a challenge winner row.
 * @returns Final/system aggregate score, review final score, or undefined when neither exists.
 * Used by the Winners tab so provisional Marathon Match aggregates do not override final review scores.
 */
export function getSubmissionFinalScoreCandidate(
    submission: SubmissionInfo,
): number | undefined {
    return toFiniteNumber(submission.finalAggregateScore)
        ?? toFiniteNumber(submission?.review?.finalScore)
}

/**
 * Enriches a submission with member-mapping user info when it is missing.
 *
 * @param submission - Submission to normalize.
 * @param memberMapping - Member mapping from the challenge context.
 * @returns Submission with the best available user info attached.
 */
function enrichSubmissionInfo(
    submission: SubmissionInfo,
    memberMapping: Record<string, BackendResource | undefined>,
): SubmissionInfo {
    const memberId = normalizeIdentifier(submission.memberId)

    if (!memberId || submission.userInfo) {
        return submission
    }

    const userInfo = memberMapping[memberId]
    return userInfo
        ? {
            ...submission,
            userInfo,
        }
        : submission
}

/**
 * Builds the ordered identity keys that can represent a submission across legacy and current data.
 *
 * @param submission - Submission to inspect.
 * @returns Ordered identity keys for matching submissions across data sources.
 */
function getSubmissionIdentityKeys(submission: SubmissionInfo): string[] {
    return [
        normalizeIdentifier(submission.id),
        normalizeIdentifier(submission.legacySubmissionId),
    ]
        .filter((key): key is string => Boolean(key))
}

/**
 * Prefers the first defined scalar value across the preferred and fallback submissions.
 *
 * @param preferredValue - Value from the higher-priority submission.
 * @param fallbackValue - Value from the lower-priority submission.
 * @returns Preferred value when defined; otherwise the fallback value.
 */
function preferDefinedValue<T>(
    preferredValue: T | undefined,
    fallbackValue: T | undefined,
): T | undefined {
    return preferredValue ?? fallbackValue
}

/**
 * Prefers a non-empty array from the higher-priority submission before falling back.
 *
 * @param preferredValue - Array from the higher-priority submission.
 * @param fallbackValue - Array from the lower-priority submission.
 * @returns Preferred non-empty array when present; otherwise the fallback array.
 */
function preferArrayValue<T>(
    preferredValue: T[] | undefined,
    fallbackValue: T[] | undefined,
): T[] | undefined {
    return preferredValue?.length ? preferredValue : fallbackValue
}

/**
 * Merges a preferred submission with a fallback record that may include richer legacy details.
 *
 * @param preferred - Submission from the higher-priority source.
 * @param fallback - Submission from a lower-priority source used to fill gaps.
 * @returns A merged submission preserving the preferred source while backfilling missing fields.
 */
function mergeSubmissionInfo(
    preferred: SubmissionInfo,
    fallback: SubmissionInfo,
): SubmissionInfo {
    return {
        ...fallback,
        ...preferred,
        aggregateScore: preferDefinedValue(preferred.aggregateScore, fallback.aggregateScore),
        finalAggregateScore: preferDefinedValue(
            preferred.finalAggregateScore,
            fallback.finalAggregateScore,
        ),
        id: preferred.id || fallback.id,
        isFileSubmission: preferDefinedValue(preferred.isFileSubmission, fallback.isFileSubmission),
        isLatest: preferDefinedValue(preferred.isLatest, fallback.isLatest),
        isPassingReview: preferDefinedValue(preferred.isPassingReview, fallback.isPassingReview),
        legacySubmissionId: preferDefinedValue(
            preferred.legacySubmissionId,
            fallback.legacySubmissionId,
        ),
        memberId: preferred.memberId || fallback.memberId,
        placement: preferDefinedValue(preferred.placement, fallback.placement),
        review: preferDefinedValue(preferred.review, fallback.review),
        reviewInfos: preferArrayValue(preferred.reviewInfos, fallback.reviewInfos),
        reviews: preferArrayValue(preferred.reviews, fallback.reviews),
        reviewTypeId: preferDefinedValue(preferred.reviewTypeId, fallback.reviewTypeId),
        status: preferDefinedValue(preferred.status, fallback.status),
        submittedDate: preferDefinedValue(preferred.submittedDate, fallback.submittedDate),
        submittedDateString: preferDefinedValue(
            preferred.submittedDateString,
            fallback.submittedDateString,
        ),
        submitterHandle: preferDefinedValue(preferred.submitterHandle, fallback.submitterHandle),
        type: preferDefinedValue(preferred.type, fallback.type),
        userInfo: preferDefinedValue(preferred.userInfo, fallback.userInfo),
        virusScan: preferDefinedValue(preferred.virusScan, fallback.virusScan),
    }
}

/**
 * Builds the submission source used by past-challenge winner rows. Winner submissions remain the
 * primary source so all placements are available to submitters, while challenge and review
 * submissions backfill handles, user info, and other legacy-safe details.
 *
 * @param args - Submission sources ordered by preference.
 * @returns Deduplicated, enriched submission source for winner/result resolution.
 */
export function buildChallengeResultSubmissionSource({
    challengeSubmissions = [],
    memberMapping,
    reviewSubmissions = [],
    winnerSubmissions = [],
}: BuildChallengeResultSubmissionSourceArgs): SubmissionInfo[] {
    const orderedSources = [
        winnerSubmissions,
        challengeSubmissions,
        reviewSubmissions,
    ]

    const mergedSubmissions: SubmissionInfo[] = []
    const submissionIndexByKey = new Map<string, number>()

    orderedSources.forEach(source => {
        source.forEach(rawSubmission => {
            const submission = enrichSubmissionInfo(rawSubmission, memberMapping)
            const identityKeys = getSubmissionIdentityKeys(submission)

            const existingIndex = identityKeys
                .map(key => submissionIndexByKey.get(key))
                .find((index): index is number => index !== undefined)

            if (existingIndex === undefined) {
                const nextIndex = mergedSubmissions.length
                mergedSubmissions.push(submission)
                identityKeys.forEach(key => submissionIndexByKey.set(key, nextIndex))
                return
            }

            const merged = mergeSubmissionInfo(
                mergedSubmissions[existingIndex],
                submission,
            )

            mergedSubmissions[existingIndex] = merged
            getSubmissionIdentityKeys(merged)
                .forEach(key => submissionIndexByKey.set(key, existingIndex))
        })
    })

    return mergedSubmissions
}
