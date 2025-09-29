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

    forEach(submissions, submission => {
        if (!grouped.has(submission.id)) {
            grouped.set(submission.id, {
                id: submission.id,
                reviews: [],
                submission,
                submitterHandle: submission.review?.submitterHandle ?? undefined,
                submitterHandleColor: submission.review?.submitterHandleColor ?? undefined,
                submitterMaxRating: submission.review?.submitterMaxRating
                    ?? undefined,
            })
        }

        const group = grouped.get(submission.id)
        if (!group) {
            return
        }

        const reviewInfo: ReviewInfo | undefined = submission.review
        const reviewId = reviewInfo?.id
        const resourceId = reviewInfo?.resourceId
        if (!reviewId) {
            return
        }

        const seenReviewIds = seenReviewIdsBySubmission.get(submission.id) ?? new Set<string>()
        if (seenReviewIds.has(reviewId)) {
            return
        }

        const reviewerInfo = resourceId ? reviewerByResourceId[resourceId] : undefined
        const reviewDate = reviewInfo?.reviewDate
            ? new Date(reviewInfo.reviewDate)
            : reviewInfo?.updatedAt
                ? new Date(reviewInfo.updatedAt)
                : undefined
        const reviewDateString = reviewInfo?.reviewDateString
            ?? reviewInfo?.updatedAtString

        const matchingReviewResult = resourceId
            ? find(submission.reviews, reviewResult => reviewResult.resourceId === resourceId)
            : undefined

        const reviewHandle = reviewInfo?.reviewerHandle?.trim() || undefined
        const resultHandle = matchingReviewResult?.reviewerHandle?.trim() || undefined
        const resourceHandle = reviewerInfo?.memberHandle?.trim() || undefined
        const finalReviewerHandle = reviewHandle
            ?? resultHandle
            ?? resourceHandle
        const finalReviewerHandleColor = reviewInfo?.reviewerHandleColor
            ?? matchingReviewResult?.reviewerHandleColor
            ?? reviewerInfo?.handleColor
        const finalReviewerMaxRating = reviewInfo?.reviewerMaxRating
            ?? matchingReviewResult?.reviewerMaxRating
            ?? reviewerInfo?.rating

        if (reviewInfo?.submitterHandle) {
            group.submitterHandle = reviewInfo.submitterHandle
            group.submitterHandleColor = reviewInfo.submitterHandleColor
            group.submitterMaxRating = reviewInfo.submitterMaxRating
        }

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
            finalScore: reviewInfo?.finalScore,
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

    grouped.forEach(group => {
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

        const latestReviewDate = group.reviews
            .map(review => review.reviewDate)
            .filter((value): value is Date => !!value)
            .sort((first, second) => second.getTime() - first.getTime())[0]

        const latestReviewDateString = latestReviewDate
            ? moment(latestReviewDate)
                .local()
                .format(TABLE_DATE_FORMAT)
            : undefined

        const submitterHandle = group.submitterHandle
            ?? group.submission.review?.submitterHandle
            ?? undefined
        const submitterMaxRating = group.submitterMaxRating
            ?? group.submission.review?.submitterMaxRating
            ?? undefined
        const submitterHandleColor = group.submitterHandleColor
            ?? group.submission.review?.submitterHandleColor
            ?? (submitterHandle
                && typeof submitterMaxRating === 'number'
                ? getRatingColor(submitterMaxRating)
                : undefined)

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

    return aggregatedRows
}
/* eslint-enable complexity */
