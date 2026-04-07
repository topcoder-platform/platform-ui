/* eslint-disable ordered-imports/ordered-imports */
import { forEach, sumBy } from 'lodash'
import moment from 'moment'

import { getRatingColor } from '~/libs/core'

import { TABLE_DATE_FORMAT } from '../../config/index.config'
import {
    BackendResource,
    MappingReviewAppeal,
    ReviewInfo,
    ReviewResult,
    SubmissionInfo,
} from '../models'
import { normalizeRatingValue } from './rating'
/* eslint-enable ordered-imports/ordered-imports */

export interface AggregatedReviewDetail {
    reviewInfo?: ReviewInfo
    reviewId?: string
    resourceId?: string
    reviewerKey?: string
    finalScore?: number
    reviewProgress?: number
    status?: string | null
    reviewDate?: Date
    reviewDateString?: string
    reviewerHandle?: string
    reviewerHandleColor?: string
    reviewerMaxRating?: number | null
    totalAppeals?: number
    finishedAppeals?: number
    unresolvedAppeals?: number
}

export interface AggregatedSubmissionReviews {
    id: string
    submission: SubmissionInfo
    reviews: AggregatedReviewDetail[]
    averageFinalScore?: number
    averageFinalScoreDisplay?: string
    latestReviewDate?: Date
    latestReviewDateString?: string
    submitterHandle?: string
    submitterHandleColor?: string
    submitterMaxRating?: number | null
    reviewerHandles?: Record<string, string | undefined>
    reviewerHandleColors?: Record<string, string | undefined>
    reviewerMaxRatings?: Record<string, number | undefined>
}

interface AggregateSubmissionReviewsParams {
    submissions: SubmissionInfo[]
    mappingReviewAppeal: MappingReviewAppeal
    reviewers: BackendResource[]
}

const normalizeScoreValue = (value: number | string | null | undefined): number | undefined => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed.length) {
            return undefined
        }

        const parsed = Number.parseFloat(trimmed)
        return Number.isFinite(parsed) ? parsed : undefined
    }

    return undefined
}

function resolveHandleColor(
    explicitColor: string | undefined,
    handle: string | undefined,
    maxRating: number | string | undefined | null,
): string | undefined {
    const normalizedRating = normalizeRatingValue(maxRating)

    return explicitColor
        ?? (handle && normalizedRating !== undefined
            ? getRatingColor(normalizedRating)
            : undefined)
}

type ReviewerIdentityArgs = {
    memberId?: string | null
    resourceId?: string | null
    reviewerHandle?: string | null
}

/**
 * Normalizes optional string values by trimming whitespace and treating empty strings as undefined.
 *
 * @param value - Optional string candidate from review/resource payloads.
 * @returns Trimmed string when present; otherwise undefined.
 */
const normalizeStringValue = (value?: string | null): string | undefined => {
    const trimmed = value?.trim()
    return trimmed?.length ? trimmed : undefined
}

/**
 * Builds ordered reviewer identity keys from the available payload fields.
 *
 * @param args - Reviewer identity candidates from resource and review payloads.
 * @returns Ordered keys: handle, member, then resource (when present).
 */
const buildReviewerIdentityKeys = ({
    memberId,
    resourceId,
    reviewerHandle,
}: ReviewerIdentityArgs): string[] => {
    const keys: string[] = []
    const normalizedHandle = normalizeStringValue(reviewerHandle)
    const normalizedMemberId = normalizeStringValue(memberId)
    const normalizedResourceId = normalizeStringValue(resourceId)

    if (normalizedHandle) {
        keys.push(`handle:${normalizedHandle.toLowerCase()}`)
    }

    if (normalizedMemberId) {
        keys.push(`member:${normalizedMemberId}`)
    }

    if (normalizedResourceId) {
        keys.push(`resource:${normalizedResourceId}`)
    }

    return keys
}

const deriveReviewResultFromReviewInfo = (reviewInfo: ReviewInfo): ReviewResult => {
    const reviewerHandle = reviewInfo.reviewerHandle?.trim() || undefined
    const reviewerMaxRating = normalizeRatingValue(reviewInfo.reviewerMaxRating)
    const reviewerHandleColor = resolveHandleColor(
        reviewInfo.reviewerHandleColor,
        reviewerHandle,
        reviewerMaxRating,
    ) ?? '#2a2a2a'

    return {
        appeals: [],
        createdAt: reviewInfo.createdAt,
        createdAtString: reviewInfo.createdAtString,
        phaseName: reviewInfo.phaseName ?? undefined,
        resourceId: reviewInfo.resourceId,
        reviewDate: reviewInfo.reviewDate,
        reviewDateString: reviewInfo.reviewDateString ?? reviewInfo.updatedAtString,
        reviewerHandle: reviewerHandle ?? '',
        reviewerHandleColor,
        reviewerMaxRating,
        reviewType: reviewInfo.reviewType ?? undefined,
        score: normalizeScoreValue(reviewInfo.finalScore ?? reviewInfo.initialScore),
    }
}

/* eslint-disable complexity */
/* eslint-disable no-console */
export function aggregateSubmissionReviews({
    submissions,
    mappingReviewAppeal,
    reviewers,
}: AggregateSubmissionReviewsParams): AggregatedSubmissionReviews[] {
    const reviewerByResourceId = reviewers.reduce<Record<string, BackendResource>>((accumulator, reviewer) => {
        accumulator[reviewer.id] = reviewer
        return accumulator
    }, {})

    const grouped = new Map<string, AggregatedSubmissionReviews>()
    const seenReviewIdsBySubmission = new Map<string, Set<string>>()
    const discoveredResourceIds = new Set<string>()
    const reviewerHandleByResourceId = reviewers.reduce<Record<string, string | undefined>>((acc, r) => {
        acc[r.id] = r.memberHandle
        return acc
    }, {})
    const canonicalResourceIdByReviewerKey: Record<string, string> = {}
    const canonicalReviewerKeyByAlias: Record<string, string> = {}
    const reviewerKeyByResourceId: Record<string, string> = {}

    const resolveCanonicalReviewerKey = (reviewerKey?: string): string | undefined => {
        if (!reviewerKey) {
            return undefined
        }

        return canonicalReviewerKeyByAlias[reviewerKey] ?? reviewerKey
    }

    const registerReviewerKeyAliases = (identityKeys: Array<string | undefined>): string | undefined => {
        const normalizedKeys = identityKeys.filter(
            (identityKey): identityKey is string => Boolean(identityKey),
        )
        if (!normalizedKeys.length) {
            return undefined
        }

        const existingCanonical = normalizedKeys
            .map(identityKey => canonicalReviewerKeyByAlias[identityKey])
            .find((candidate): candidate is string => Boolean(candidate))
        const canonicalKey = existingCanonical ?? normalizedKeys[0]

        normalizedKeys.forEach(identityKey => {
            canonicalReviewerKeyByAlias[identityKey] = canonicalKey
        })

        return canonicalKey
    }

    reviewers.forEach(reviewer => {
        const reviewerIdentityKeys = buildReviewerIdentityKeys({
            memberId: reviewer.memberId,
            resourceId: reviewer.id,
            reviewerHandle: reviewer.memberHandle,
        })
        const reviewerKey = registerReviewerKeyAliases(reviewerIdentityKeys)
        if (!reviewerKey) {
            return
        }

        if (!canonicalResourceIdByReviewerKey[reviewerKey]) {
            canonicalResourceIdByReviewerKey[reviewerKey] = reviewer.id
        }

        reviewerKeyByResourceId[reviewer.id] = reviewerKey
    })

    forEach(submissions, submission => {
        if (!grouped.has(submission.id)) {
            const reviewSubmitterHandle = submission.review?.submitterHandle?.trim()
            const userInfoHandle = submission.userInfo?.memberHandle?.trim()
            const initialSubmitterHandle = reviewSubmitterHandle
                ?? userInfoHandle
                ?? undefined
            const initialSubmitterColor = submission.review?.submitterHandleColor
                ?? submission.userInfo?.handleColor
                ?? undefined
            const initialSubmitterMaxRating = normalizeRatingValue(
                submission.review?.submitterMaxRating
                    ?? submission.userInfo?.maxRating
                    ?? submission.userInfo?.rating,
            )

            grouped.set(submission.id, {
                id: submission.id,
                reviews: [],
                submission,
                submitterHandle: initialSubmitterHandle,
                submitterHandleColor: initialSubmitterColor,
                submitterMaxRating: initialSubmitterMaxRating,
            })
        }

        const group = grouped.get(submission.id)
        if (!group) {
            return
        }

        const reviewInfoByResourceId = new Map<string, ReviewInfo>()
        const reviewInfoById = new Map<string, ReviewInfo>()

        if (submission.review?.resourceId) {
            reviewInfoByResourceId.set(submission.review.resourceId, submission.review)
        }

        if (submission.review?.id) {
            reviewInfoById.set(submission.review.id, submission.review)
        }

        const additionalReviewInfos = Array.isArray(submission.reviewInfos)
            ? submission.reviewInfos
            : []
        additionalReviewInfos.forEach(info => {
            if (info.id) {
                reviewInfoById.set(info.id, info)
            }

            if (info.resourceId) {
                reviewInfoByResourceId.set(info.resourceId, info)
            }
        })

        const seenReviewIds = seenReviewIdsBySubmission.get(submission.id) ?? new Set<string>()
        const reviewsToProcess: ReviewResult[] = Array.isArray(submission.reviews)
            ? submission.reviews.slice()
            : []

        if (!reviewsToProcess.length && submission.review) {
            reviewsToProcess.push(deriveReviewResultFromReviewInfo(submission.review))
        } else if (submission.review?.resourceId) {
            const hasMatchingReview = reviewsToProcess.some(
                review => review.resourceId === submission.review?.resourceId,
            )
            if (!hasMatchingReview) {
                reviewsToProcess.push(deriveReviewResultFromReviewInfo(submission.review))
            }
        }

        forEach(reviewsToProcess, reviewResult => {
            const rawResourceId = reviewResult.resourceId
            const reviewResultId = reviewResult.id
            const reviewInfoFromId = reviewResultId
                ? reviewInfoById.get(reviewResultId)
                : undefined
            const reviewInfo = reviewInfoFromId
                ?? (rawResourceId
                    ? reviewInfoByResourceId.get(rawResourceId)
                    : submission.review && !submission.review.resourceId
                        ? submission.review
                        : undefined)
            const reviewId = reviewInfo?.id ?? reviewResultId
            const reviewerInfo = rawResourceId ? reviewerByResourceId[rawResourceId] : undefined

            const reviewDate = reviewInfo?.reviewDate
                ? new Date(reviewInfo.reviewDate)
                : reviewInfo?.updatedAt
                    ? new Date(reviewInfo.updatedAt)
                    : reviewResult.reviewDate instanceof Date
                        ? reviewResult.reviewDate
                        : reviewResult.reviewDate
                            ? new Date(reviewResult.reviewDate)
                            : undefined
            const reviewDateString = reviewInfo?.reviewDateString
                ?? reviewInfo?.updatedAtString
                ?? reviewResult.reviewDateString

            const reviewHandle = reviewInfo?.reviewerHandle?.trim() || undefined
            const resultHandle = reviewResult.reviewerHandle?.trim() || undefined
            const resourceHandle = reviewerInfo?.memberHandle?.trim() || undefined
            const fallbackMappedHandle = rawResourceId
                ? reviewerHandleByResourceId[rawResourceId]?.trim()
                : undefined
            const candidateReviewerHandle = reviewHandle
                ?? resultHandle
                ?? resourceHandle
            const resolvedReviewerHandle = candidateReviewerHandle
                ?? fallbackMappedHandle

            const reviewerIdentityKeys = buildReviewerIdentityKeys({
                memberId: reviewerInfo?.memberId,
                resourceId: rawResourceId,
                reviewerHandle: resolvedReviewerHandle ?? fallbackMappedHandle,
            })
            const reviewerKey = registerReviewerKeyAliases(reviewerIdentityKeys)
            const canonicalReviewerKey = resolveCanonicalReviewerKey(reviewerKey)

            const canonicalResourceId = canonicalReviewerKey
                ? (
                    canonicalResourceIdByReviewerKey[canonicalReviewerKey]
                    ?? rawResourceId
                )
                : rawResourceId
            const resourceId = canonicalResourceId

            if (canonicalReviewerKey && resourceId && !canonicalResourceIdByReviewerKey[canonicalReviewerKey]) {
                canonicalResourceIdByReviewerKey[canonicalReviewerKey] = resourceId
            }

            if (resourceId && canonicalReviewerKey) {
                reviewerKeyByResourceId[resourceId] = canonicalReviewerKey
            }

            if (rawResourceId && canonicalReviewerKey) {
                reviewerKeyByResourceId[rawResourceId] = canonicalReviewerKey
            }

            if (resourceId && resolvedReviewerHandle) {
                reviewerHandleByResourceId[resourceId] = resolvedReviewerHandle
            }

            if (rawResourceId && resolvedReviewerHandle) {
                reviewerHandleByResourceId[rawResourceId] = resolvedReviewerHandle
            }

            const reviewKey = reviewId ?? (resourceId ? `resource:${resourceId}` : undefined)

            if (reviewKey && seenReviewIds.has(reviewKey)) {
                return
            }

            if (resourceId) {
                discoveredResourceIds.add(resourceId)
            }

            const finalReviewerMaxRating = normalizeRatingValue(
                reviewInfo?.reviewerMaxRating
                    ?? reviewResult.reviewerMaxRating
                    ?? reviewerInfo?.rating,
            )
            const finalReviewerHandleColor = resolveHandleColor(
                reviewInfo?.reviewerHandleColor
                    ?? reviewResult.reviewerHandleColor
                    ?? reviewerInfo?.handleColor,
                resolvedReviewerHandle ?? fallbackMappedHandle,
                finalReviewerMaxRating,
            )

            if (reviewInfo) {
                const trimmedSubmitterHandle = reviewInfo.submitterHandle?.trim()
                if (trimmedSubmitterHandle) {
                    group.submitterHandle = trimmedSubmitterHandle
                }

                if (reviewInfo.submitterHandleColor) {
                    group.submitterHandleColor = reviewInfo.submitterHandleColor
                }

                const normalizedSubmitterMaxRating = normalizeRatingValue(reviewInfo.submitterMaxRating)
                if (normalizedSubmitterMaxRating !== undefined) {
                    group.submitterMaxRating = normalizedSubmitterMaxRating
                }
            }

            const finalScore = normalizeScoreValue(
                reviewResult.score
                    ?? reviewInfo?.finalScore
                    ?? reviewInfo?.initialScore,
            )

            let normalizedReviewInfo: ReviewInfo | undefined = reviewInfo
            if (reviewInfo) {
                const needsHandle = !reviewInfo.reviewerHandle?.trim() && resolvedReviewerHandle
                const needsColor = !reviewInfo.reviewerHandleColor && finalReviewerHandleColor
                const needsMaxRating = (
                    reviewInfo.reviewerMaxRating === undefined
                    || reviewInfo.reviewerMaxRating === null
                )
                    && finalReviewerMaxRating !== undefined

                if (needsHandle || needsColor || needsMaxRating) {
                    normalizedReviewInfo = {
                        ...reviewInfo,
                        reviewerHandle: needsHandle
                            ? resolvedReviewerHandle ?? reviewInfo.reviewerHandle
                            : reviewInfo.reviewerHandle,
                        reviewerHandleColor: needsColor
                            ? finalReviewerHandleColor ?? reviewInfo.reviewerHandleColor
                            : reviewInfo.reviewerHandleColor,
                        reviewerMaxRating: needsMaxRating
                            ? finalReviewerMaxRating ?? reviewInfo.reviewerMaxRating
                            : reviewInfo.reviewerMaxRating,
                    }
                }
            }

            if (process.env.NODE_ENV !== 'production') {
                if (resolvedReviewerHandle) {
                    console.debug('[ReviewAggregation] Resolved reviewer handle', {
                        resourceHandle: reviewerInfo?.memberHandle,
                        reviewerHandle: resolvedReviewerHandle,
                        reviewId,
                        reviewInfoHandle: reviewInfo?.reviewerHandle,
                        reviewResultHandle: resultHandle,
                        source: reviewHandle
                            ? 'reviewInfo'
                            : resultHandle
                                ? 'reviewResult'
                                : 'resourceMapping',
                        submissionId: submission.id,
                    })
                } else {
                    console.debug('[ReviewAggregation] Missing reviewer handle', {
                        resourceHandle: reviewerInfo?.memberHandle,
                        reviewerHandle: resolvedReviewerHandle,
                        reviewId,
                        reviewInfoHandle: reviewInfo?.reviewerHandle,
                        reviewResultHandle: resultHandle,
                        submissionId: submission.id,
                    })
                }

                console.debug('[ReviewAggregation] Processing review', {
                    finalScore,
                    resourceId,
                    reviewerHandle: resolvedReviewerHandle,
                    reviewId,
                    submissionId: submission.id,
                })

                if (finalScore !== undefined) {
                    console.debug('[ReviewAggregation] Review score resolved', {
                        finalScore,
                        resourceId,
                        reviewId,
                        submissionId: submission.id,
                    })
                } else {
                    console.debug('[ReviewAggregation] Review score missing', {
                        resourceId,
                        reviewId,
                        submissionId: submission.id,
                    })
                }
            }

            const appealInfo = reviewId ? mappingReviewAppeal[reviewId] : undefined
            const finishedAppeals = appealInfo?.finishAppeals ?? 0
            const totalAppeals = appealInfo?.totalAppeals ?? 0
            const unresolvedAppeals = totalAppeals - finishedAppeals
            const reviewerHandleForDetail = resolvedReviewerHandle ?? fallbackMappedHandle
            const normalizedReviewerHandleForDetail = normalizeStringValue(reviewerHandleForDetail)
                ?.toLowerCase()
            const reviewerCanonicalKey = resolveCanonicalReviewerKey(reviewerKey)

            const existingDetail = group.reviews.find(detail => {
                const detailReviewId = detail.reviewInfo?.id ?? detail.reviewId
                if (detailReviewId && reviewId) {
                    return detailReviewId === reviewId
                }

                if (reviewerCanonicalKey) {
                    const detailResourceId = detail.resourceId ?? detail.reviewInfo?.resourceId
                    const detailIdentityKeys = buildReviewerIdentityKeys({
                        memberId: detailResourceId
                            ? reviewerByResourceId[detailResourceId]?.memberId
                            : undefined,
                        resourceId: detailResourceId,
                        reviewerHandle: detail.reviewerHandle
                            ?? detail.reviewInfo?.reviewerHandle
                            ?? (detailResourceId ? reviewerHandleByResourceId[detailResourceId] : undefined),
                    })
                    const detailReviewerKey = resolveCanonicalReviewerKey(registerReviewerKeyAliases([
                        detail.reviewerKey,
                        detailResourceId ? reviewerKeyByResourceId[detailResourceId] : undefined,
                        ...detailIdentityKeys,
                    ]))
                    if (detailReviewerKey) {
                        return detailReviewerKey === reviewerCanonicalKey
                    }
                }

                if (normalizedReviewerHandleForDetail) {
                    const detailResourceId = detail.resourceId ?? detail.reviewInfo?.resourceId
                    const detailReviewerHandle = normalizeStringValue(
                        detail.reviewerHandle
                            ?? detail.reviewInfo?.reviewerHandle
                            ?? (detailResourceId ? reviewerHandleByResourceId[detailResourceId] : undefined),
                    )
                    if (detailReviewerHandle?.toLowerCase() === normalizedReviewerHandleForDetail) {
                        return true
                    }
                }

                if (!detailReviewId && !reviewId && resourceId) {
                    const detailResourceId = detail.resourceId ?? detail.reviewInfo?.resourceId
                    return detailResourceId === resourceId
                }

                return false
            })

            const resolvedStatus = normalizedReviewInfo?.status
                ?? ((finalScore !== undefined && reviewDate)
                    ? 'COMPLETED'
                    : undefined)

            const newDetail: AggregatedReviewDetail = {
                finalScore,
                finishedAppeals: appealInfo?.finishAppeals,
                resourceId,
                reviewDate,
                reviewDateString,
                reviewerHandle: reviewerHandleForDetail,
                reviewerHandleColor: finalReviewerHandleColor,
                reviewerKey,
                reviewerMaxRating: finalReviewerMaxRating,
                reviewId,
                reviewInfo: normalizedReviewInfo,
                reviewProgress: normalizedReviewInfo?.reviewProgress,
                status: resolvedStatus,
                totalAppeals,
                unresolvedAppeals,
            }

            if (existingDetail) {
                if (finalScore !== undefined) {
                    existingDetail.finalScore = finalScore
                }

                if (reviewId) {
                    existingDetail.reviewId = reviewId
                }

                if (appealInfo?.finishAppeals !== undefined) {
                    existingDetail.finishedAppeals = appealInfo.finishAppeals
                }

                if (reviewDate) {
                    existingDetail.reviewDate = reviewDate
                }

                if (reviewDateString) {
                    existingDetail.reviewDateString = reviewDateString
                }

                if (reviewerHandleForDetail) {
                    existingDetail.reviewerHandle = reviewerHandleForDetail
                    if (resourceId && !reviewerHandleByResourceId[resourceId]) {
                        reviewerHandleByResourceId[resourceId] = reviewerHandleForDetail
                    }
                }

                if (finalReviewerHandleColor) {
                    existingDetail.reviewerHandleColor = finalReviewerHandleColor
                }

                if (finalReviewerMaxRating !== undefined) {
                    existingDetail.reviewerMaxRating = finalReviewerMaxRating
                }

                if (reviewerKey) {
                    const existingReviewerKey = resolveCanonicalReviewerKey(existingDetail.reviewerKey)
                    if (existingReviewerKey !== reviewerKey) {
                        existingDetail.reviewerKey = reviewerKey
                    }
                }

                if (normalizedReviewInfo) {
                    existingDetail.reviewInfo = existingDetail.reviewInfo
                        ? {
                            ...existingDetail.reviewInfo,
                            ...normalizedReviewInfo,
                            reviewerHandle: normalizedReviewInfo.reviewerHandle
                                ?? existingDetail.reviewInfo.reviewerHandle,
                            reviewerHandleColor: normalizedReviewInfo.reviewerHandleColor
                                ?? existingDetail.reviewInfo.reviewerHandleColor,
                            reviewerMaxRating: normalizedReviewInfo.reviewerMaxRating
                                ?? existingDetail.reviewInfo.reviewerMaxRating,
                        }
                        : normalizedReviewInfo
                }

                if (normalizedReviewInfo?.reviewProgress !== undefined) {
                    existingDetail.reviewProgress = normalizedReviewInfo.reviewProgress
                }

                if (resolvedStatus !== undefined) {
                    existingDetail.status = resolvedStatus
                }

                existingDetail.totalAppeals = totalAppeals
                existingDetail.unresolvedAppeals = unresolvedAppeals

                if (reviewKey) {
                    seenReviewIds.add(reviewKey)
                }

                seenReviewIdsBySubmission.set(submission.id, seenReviewIds)
                return
            }

            group.reviews.push(newDetail)

            if (reviewKey) {
                seenReviewIds.add(reviewKey)
            }

            seenReviewIdsBySubmission.set(submission.id, seenReviewIds)
        })
    })

    const aggregatedRows: AggregatedSubmissionReviews[] = []

    // Establish a deterministic reviewer order across all submissions.
    // Prefer the explicit reviewers list; otherwise fall back to discovered resourceIds.
    const orderedResourceIds: string[] = (() => {
        const compareReviewerIds = (a: string, b: string): number => (
            (reviewerHandleByResourceId[a] || a)
                .localeCompare(reviewerHandleByResourceId[b] || b, undefined, { sensitivity: 'base' })
        )

        const base: string[] = reviewers.length
            ? reviewers
                .slice()
                .sort((a, b) => (
                    (a.memberHandle || '')
                        .localeCompare(
                            b.memberHandle || '',
                            undefined,
                            { sensitivity: 'base' },
                        )
                    || a.id.localeCompare(b.id)
                ))
                .map(r => {
                    const reviewerIdentityKeys = buildReviewerIdentityKeys({
                        memberId: r.memberId,
                        resourceId: r.id,
                        reviewerHandle: r.memberHandle ?? reviewerHandleByResourceId[r.id],
                    })
                    const reviewerKey = resolveCanonicalReviewerKey(
                        reviewerKeyByResourceId[r.id]
                            ?? registerReviewerKeyAliases(reviewerIdentityKeys),
                    )
                    const canonicalResourceId = reviewerKey
                        ? (canonicalResourceIdByReviewerKey[reviewerKey] ?? r.id)
                        : r.id

                    if (reviewerKey) {
                        reviewerKeyByResourceId[canonicalResourceId] = reviewerKey
                        reviewerKeyByResourceId[r.id] = reviewerKey
                        if (!canonicalResourceIdByReviewerKey[reviewerKey]) {
                            canonicalResourceIdByReviewerKey[reviewerKey] = canonicalResourceId
                        }
                    }

                    return canonicalResourceId
                })
            : Array.from(discoveredResourceIds)
                .slice()
                .sort(compareReviewerIds)

        const uniqueBase = Array.from(new Set(base))

        // Ensure any discovered ids that aren't in base are appended deterministically
        const baseSet = new Set(uniqueBase)
        const extras = Array.from(discoveredResourceIds)
            .filter(id => !baseSet.has(id))
            .sort(compareReviewerIds)

        return [...uniqueBase, ...extras]
    })()

    grouped.forEach(group => {
        // Reorder reviews to match the deterministic reviewer order and
        // insert placeholders for missing reviewers so columns align.
        const byResourceId: Record<string, AggregatedReviewDetail> = {}
        const byReviewerKey: Record<string, AggregatedReviewDetail> = {}
        group.reviews.forEach(r => {
            if (r.resourceId) {
                byResourceId[r.resourceId] = r
            }

            const reviewerIdentityKeys = buildReviewerIdentityKeys({
                memberId: r.resourceId ? reviewerByResourceId[r.resourceId]?.memberId : undefined,
                resourceId: r.resourceId,
                reviewerHandle: r.reviewerHandle ?? r.reviewInfo?.reviewerHandle,
            })
            const reviewerKey = resolveCanonicalReviewerKey(registerReviewerKeyAliases([
                r.reviewerKey,
                r.resourceId ? reviewerKeyByResourceId[r.resourceId] : undefined,
                ...reviewerIdentityKeys,
            ]))
            if (reviewerKey) {
                r.reviewerKey = reviewerKey
                if (r.resourceId) {
                    reviewerKeyByResourceId[r.resourceId] = reviewerKey
                }

                if (!byReviewerKey[reviewerKey]) {
                    byReviewerKey[reviewerKey] = r
                }
            }
        })

        const ordered: AggregatedReviewDetail[] = []
        orderedResourceIds.forEach(id => {
            const reviewerKey = resolveCanonicalReviewerKey(
                reviewerKeyByResourceId[id]
                    ?? registerReviewerKeyAliases(buildReviewerIdentityKeys({
                        memberId: reviewerByResourceId[id]?.memberId,
                        resourceId: id,
                        reviewerHandle: reviewerHandleByResourceId[id],
                    })),
            )
            const directMatch = byResourceId[id]
            if (directMatch) {
                ordered.push(directMatch)
                return
            }

            const reviewerKeyMatch = reviewerKey
                ? byReviewerKey[reviewerKey]
                : undefined
            if (reviewerKeyMatch) {
                ordered.push(reviewerKeyMatch)
                return
            }

            ordered.push({
                finishedAppeals: 0,
                resourceId: id,
                reviewerHandle: reviewerHandleByResourceId[id],
                reviewerKey,
                totalAppeals: 0,
                unresolvedAppeals: 0,
            })
        })

        const orderedReviewsSet = new Set<AggregatedReviewDetail>(ordered)
        const orderedReviewerKeys = new Set<string>(
            ordered
                .map(review => review.reviewerKey)
                .filter((value): value is string => Boolean(value)),
        )
        const orderedReviewerHandles = new Set<string>(
            ordered
                .map(review => normalizeStringValue(
                    review.reviewerHandle
                        ?? review.reviewInfo?.reviewerHandle
                        ?? (review.resourceId ? reviewerHandleByResourceId[review.resourceId] : undefined),
                ))
                .filter((value): value is string => Boolean(value))
                .map(handle => handle.toLowerCase()),
        )
        // Append any reviews that were not captured in the ordered reviewer list.
        const unmatched = group.reviews
            .filter(r => {
                if (orderedReviewsSet.has(r)) {
                    return false
                }

                if (r.reviewerKey && orderedReviewerKeys.has(r.reviewerKey)) {
                    return false
                }

                const unmatchedHandle = normalizeStringValue(
                    r.reviewerHandle
                        ?? r.reviewInfo?.reviewerHandle
                        ?? (r.resourceId ? reviewerHandleByResourceId[r.resourceId] : undefined),
                )
                if (unmatchedHandle && orderedReviewerHandles.has(unmatchedHandle.toLowerCase())) {
                    return false
                }

                return true
            })
            .slice()
            .sort((a, b) => (
                (a.reviewerHandle || '')
                    .localeCompare(
                        b.reviewerHandle || '',
                        undefined,
                        { sensitivity: 'base' },
                    )
            ))

        group.reviews = [...ordered, ...unmatched]
        const scoredReviews = group.reviews.filter(
            review => typeof review.finalScore === 'number'
                && Number.isFinite(review.finalScore),
        )
        const numericScores = scoredReviews.map(review => review.finalScore as number)
        const averageFinalScore = numericScores.length
            ? sumBy(numericScores, value => value) / numericScores.length
            : undefined
        const averageFinalScoreDisplay = typeof averageFinalScore === 'number'
            ? averageFinalScore.toFixed(2)
            : undefined

        const completedStatuses = new Set(['COMPLETED', 'SUBMITTED'])
        const allCompleted = group.reviews.length > 0
            && group.reviews.every(r => completedStatuses.has((r.status ?? '').toUpperCase()))

        const latestReviewDate = allCompleted
            ? group.reviews
                .map(review => review.reviewDate)
                .filter((value): value is Date => !!value)
                .sort((first, second) => second.getTime() - first.getTime())[0]
            : undefined

        const latestReviewDateString = latestReviewDate
            ? moment(latestReviewDate)
                .local()
                .format(TABLE_DATE_FORMAT)
            : undefined

        const submitterHandle = group.submitterHandle
            ?? group.submission.review?.submitterHandle?.trim()
            ?? group.submission.userInfo?.memberHandle?.trim()
            ?? undefined
        const submitterMaxRating = normalizeRatingValue(
            group.submitterMaxRating
                ?? group.submission.review?.submitterMaxRating
                ?? group.submission.userInfo?.maxRating
                ?? group.submission.userInfo?.rating
                ?? undefined,
        )
        const submitterHandleColor = resolveHandleColor(
            group.submitterHandleColor
                ?? group.submission.review?.submitterHandleColor
                ?? group.submission.userInfo?.handleColor,
            submitterHandle,
            submitterMaxRating,
        )

        const reviewerHandlesForGroup: Record<string, string | undefined> = {}
        const reviewerHandleColorsForGroup: Record<string, string | undefined> = {}
        const reviewerMaxRatingsForGroup: Record<string, number | undefined> = {}

        group.reviews.forEach(review => {
            const resourceKey = review.resourceId
                ?? review.reviewInfo?.resourceId
            if (!resourceKey) {
                return
            }

            const handleCandidates = [
                review.reviewerHandle,
                review.reviewInfo?.reviewerHandle,
                reviewerHandleByResourceId[resourceKey],
            ]
                .map(candidate => candidate?.trim())
                .filter((candidate): candidate is string => Boolean(candidate))

            const resolvedHandleCandidate: string | undefined = handleCandidates[0]

            if (resolvedHandleCandidate && !reviewerHandlesForGroup[resourceKey]) {
                reviewerHandlesForGroup[resourceKey] = resolvedHandleCandidate
            }

            const ratingCandidates = [
                review.reviewerMaxRating,
                review.reviewInfo?.reviewerMaxRating,
                normalizeRatingValue(reviewerByResourceId[resourceKey]?.maxRating),
                normalizeRatingValue(reviewerByResourceId[resourceKey]?.rating),
            ]
                .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))

            const resolvedRating: number | undefined = ratingCandidates[0]
            if (resolvedRating !== undefined && reviewerMaxRatingsForGroup[resourceKey] === undefined) {
                reviewerMaxRatingsForGroup[resourceKey] = resolvedRating
            }

            const colorCandidates = [
                review.reviewerHandleColor,
                review.reviewInfo?.reviewerHandleColor,
                reviewerByResourceId[resourceKey]?.handleColor,
            ]
                .map(candidate => (typeof candidate === 'string' ? candidate.trim() : undefined))
                .filter((candidate): candidate is string => Boolean(candidate))

            let resolvedColor: string | undefined = colorCandidates[0]
            if (!resolvedColor && resolvedHandleCandidate) {
                resolvedColor = resolveHandleColor(
                    undefined,
                    resolvedHandleCandidate,
                    resolvedRating,
                )
            }

            if (resolvedColor && !reviewerHandleColorsForGroup[resourceKey]) {
                reviewerHandleColorsForGroup[resourceKey] = resolvedColor
            }

            if (resolvedHandleCandidate && !review.reviewerHandle) {
                review.reviewerHandle = resolvedHandleCandidate
            }

            if (resolvedColor && !review.reviewerHandleColor) {
                review.reviewerHandleColor = resolvedColor
            }

            if (resolvedRating !== undefined && review.reviewerMaxRating === undefined) {
                review.reviewerMaxRating = resolvedRating
            }
        })

        aggregatedRows.push({
            ...group,
            averageFinalScore,
            averageFinalScoreDisplay,
            latestReviewDate,
            latestReviewDateString,
            reviewerHandleColors: reviewerHandleColorsForGroup,
            reviewerHandles: reviewerHandlesForGroup,
            reviewerMaxRatings: reviewerMaxRatingsForGroup,
            submitterHandle,
            submitterHandleColor,
            submitterMaxRating,
        })
    })

    return aggregatedRows
}
/* eslint-enable complexity */
