/* eslint-disable ordered-imports/ordered-imports */
import { find, forEach, sumBy } from 'lodash'
import moment from 'moment'

import { getRatingColor } from '~/libs/core'

import { TABLE_DATE_FORMAT } from '../../config/index.config'
import {
    BackendResource,
    MappingReviewAppeal,
    ReviewInfo,
    SubmissionInfo,
} from '../models'
import { normalizeRatingValue } from './rating'
/* eslint-enable ordered-imports/ordered-imports */

export interface AggregatedReviewDetail {
    reviewInfo?: ReviewInfo
    reviewId?: string
    resourceId?: string
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

        const reviewInfo: ReviewInfo | undefined = submission.review
        const reviewId = reviewInfo?.id
        const resourceId = reviewInfo?.resourceId
        const matchingReviewResult = resourceId
            ? find(submission.reviews, reviewResult => reviewResult.resourceId === resourceId)
            : undefined
        if (!reviewId) {
            if (process.env.NODE_ENV !== 'production') {
                try {
                    console.debug('[aggregateSubmissionReviews] skipped review without id', {
                        resourceId,
                        reviewInfo,
                        reviewResult: matchingReviewResult,
                        submissionId: submission.id,
                    })
                } catch {
                    // ignore logging failures
                }
            }

            return
        }

        const seenReviewIds = seenReviewIdsBySubmission.get(submission.id) ?? new Set<string>()
        if (seenReviewIds.has(reviewId)) {
            return
        }

        const reviewerInfo = resourceId ? reviewerByResourceId[resourceId] : undefined
        if (resourceId) {
            discoveredResourceIds.add(resourceId)
        }

        const reviewDate = reviewInfo?.reviewDate
            ? new Date(reviewInfo.reviewDate)
            : reviewInfo?.updatedAt
                ? new Date(reviewInfo.updatedAt)
                : undefined
        const reviewDateString = reviewInfo?.reviewDateString
            ?? reviewInfo?.updatedAtString

        const reviewHandle = reviewInfo?.reviewerHandle?.trim() || undefined
        const resultHandle = matchingReviewResult?.reviewerHandle?.trim() || undefined
        const resourceHandle = reviewerInfo?.memberHandle?.trim() || undefined
        const finalReviewerHandle = reviewHandle
            ?? resultHandle
            ?? resourceHandle
        if (resourceId && !reviewerHandleByResourceId[resourceId]) {
            reviewerHandleByResourceId[resourceId] = finalReviewerHandle
        }

        const finalReviewerMaxRating = normalizeRatingValue(
            reviewInfo?.reviewerMaxRating
                ?? matchingReviewResult?.reviewerMaxRating
                ?? reviewerInfo?.rating,
        )
        const finalReviewerHandleColor = resolveHandleColor(
            reviewInfo?.reviewerHandleColor
                ?? matchingReviewResult?.reviewerHandleColor
                ?? reviewerInfo?.handleColor,
            finalReviewerHandle,
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
            reviewInfo?.finalScore ?? matchingReviewResult?.score,
        )

        if (process.env.NODE_ENV !== 'production') {
            if (finalReviewerHandle) {
                console.debug('[ReviewAggregation] Resolved reviewer handle', {
                    resourceHandle: reviewerInfo?.memberHandle,
                    reviewerHandle: finalReviewerHandle,
                    reviewId,
                    reviewInfoHandle: reviewInfo?.reviewerHandle,
                    reviewResultHandle: matchingReviewResult?.reviewerHandle,
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
                    reviewerHandle: finalReviewerHandle,
                    reviewId,
                    reviewInfoHandle: reviewInfo?.reviewerHandle,
                    reviewResultHandle: matchingReviewResult?.reviewerHandle,
                    submissionId: submission.id,
                })
            }
        }

        const appealInfo = reviewId ? mappingReviewAppeal[reviewId] : undefined
        const finishedAppeals = appealInfo?.finishAppeals ?? 0
        const totalAppeals = appealInfo?.totalAppeals ?? 0
        const unresolvedAppeals = totalAppeals - finishedAppeals

        group.reviews.push({
            finalScore,
            finishedAppeals: appealInfo?.finishAppeals,
            resourceId,
            reviewDate,
            reviewDateString,
            reviewerHandle: finalReviewerHandle,
            reviewerHandleColor: finalReviewerHandleColor,
            reviewerMaxRating: finalReviewerMaxRating,
            reviewId,
            reviewInfo,
            reviewProgress: reviewInfo?.reviewProgress,
            status: reviewInfo?.status,
            totalAppeals,
            unresolvedAppeals,
        })

        seenReviewIds.add(reviewId)
        seenReviewIdsBySubmission.set(submission.id, seenReviewIds)
    })

    const aggregatedRows: AggregatedSubmissionReviews[] = []

    // Establish a deterministic reviewer order across all submissions.
    // Prefer the explicit reviewers list; otherwise fall back to discovered resourceIds.
    const orderedResourceIds: string[] = (() => {
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
                .map(r => r.id)
            : Array.from(discoveredResourceIds)
                .slice()
                .sort((a, b) => (reviewerHandleByResourceId[a] || a)
                    .localeCompare(reviewerHandleByResourceId[b] || b, undefined, { sensitivity: 'base' }))

        // Ensure any discovered ids that aren't in base are appended deterministically
        const baseSet = new Set(base)
        const extras = Array.from(discoveredResourceIds)
            .filter(id => !baseSet.has(id))
            .sort((a, b) => (reviewerHandleByResourceId[a] || a)
                .localeCompare(reviewerHandleByResourceId[b] || b, undefined, { sensitivity: 'base' }))

        return [...base, ...extras]
    })()

    grouped.forEach(group => {
        // Reorder reviews to match the deterministic reviewer order and
        // insert placeholders for missing reviewers so columns align.
        const byResourceId: Record<string, AggregatedReviewDetail> = {}
        group.reviews.forEach(r => {
            if (r.resourceId) {
                byResourceId[r.resourceId] = r
            }
        })

        const ordered: AggregatedReviewDetail[] = []
        orderedResourceIds.forEach(id => {
            if (byResourceId[id]) {
                ordered.push(byResourceId[id])
            } else {
                ordered.push({
                    finishedAppeals: 0,
                    resourceId: id,
                    totalAppeals: 0,
                    unresolvedAppeals: 0,
                })
            }
        })

        // Append any reviews without a resourceId (rare) in a deterministic way
        const unmatched = group.reviews
            .filter(r => !r.resourceId)
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

        aggregatedRows.push({
            ...group,
            averageFinalScore,
            averageFinalScoreDisplay,
            latestReviewDate,
            latestReviewDateString,
            submitterHandle,
            submitterHandleColor,
            submitterMaxRating,
        })
    })

    if (process.env.NODE_ENV !== 'production') {
        try {
            console.debug('[aggregateSubmissionReviews] summaries', aggregatedRows.map(row => ({
                reviews: row.reviews.map(review => ({
                    finalScore: review.finalScore
                        ?? review.reviewInfo?.finalScore,
                    resourceId: review.resourceId,
                    reviewerHandle: review.reviewerHandle
                        ?? review.reviewInfo?.reviewerHandle,
                    reviewId: review.reviewId ?? review.reviewInfo?.id,
                })),
                submissionId: row.id,
            })))
        } catch {
            // ignore logging errors
        }
    }

    return aggregatedRows
}
/* eslint-enable complexity */
