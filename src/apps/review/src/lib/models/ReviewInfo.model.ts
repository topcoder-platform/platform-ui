import { forEach } from 'lodash'
import moment from 'moment'

import { getRatingColor } from '~/libs/core'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

import { adjustReviewItemInfo, ReviewItemInfo } from './ReviewItemInfo.model'
import { BackendReview } from './BackendReview.model'
import { BackendReviewItem, convertBackendReviewItem } from './BackendReviewItem.model'
import { ScorecardInfo } from './ScorecardInfo.model'
import { ScorecardQuestion } from './ScorecardQuestion.model'

const parseDateValue = (value?: string | Date | null): Date | undefined => {
    if (!value) {
        return undefined
    }

    return value instanceof Date ? value : new Date(value)
}

const formatDateString = (value?: Date): string => (
    value
        ? moment(value)
            .local()
            .format(TABLE_DATE_FORMAT)
        : ''
)

const formatOptionalDateString = (value?: Date): string | undefined => (
    value
        ? moment(value)
            .local()
            .format(TABLE_DATE_FORMAT)
        : undefined
)

const calculateReviewProgress = (items: BackendReviewItem[] = []): number => {
    if (!items.length) {
        return 0
    }

    const answered = items.reduce(
        (count, item) => (item.initialAnswer ? count + 1 : count),
        0,
    )

    return Math.round((answered * 100) / items.length)
}

const normalizeReviewerHandle = (handle?: string | null): string | undefined => (
    handle?.trim() || undefined
)

const calculateReviewItemInfoProgress = (items: ReviewItemInfo[]): number => {
    if (!items.length) {
        return 0
    }

    const answered = items.reduce(
        (count, item) => (item.initialAnswer ? count + 1 : count),
        0,
    )

    return Math.round((answered * 100) / items.length)
}

const formatDateStringWithFallback = (
    value: Date | undefined,
    fallback: string | Date | undefined,
): string | undefined => (
    value
        ? moment(value)
            .local()
            .format(TABLE_DATE_FORMAT)
        : typeof fallback === 'string'
            ? fallback
            : undefined
)

const resolveRatingColor = (
    rating: number | undefined,
    handle: string | undefined,
    fallback: string | undefined,
): string | undefined => (
    rating && handle ? getRatingColor(rating) : fallback
)

const resolveReviewDateString = (
    reviewDate: Date | undefined,
    existingReviewDateString: string | undefined,
    originalReviewDate: string | Date | undefined,
): string | undefined => {
    if (reviewDate) {
        return moment(reviewDate)
            .local()
            .format(TABLE_DATE_FORMAT)
    }

    if (typeof existingReviewDateString === 'string') {
        return existingReviewDateString
    }

    return typeof originalReviewDate === 'string' ? originalReviewDate : undefined
}

/**
 * Review info
 */
export interface ReviewInfo {
    id?: string
    createdAt: string | Date
    createdAtString?: string // this field is calculated at frontend
    updatedAt: string | Date
    updatedAtString?: string // this field is calculated at frontend
    reviewDate?: string | Date
    reviewDateString?: string // this field is calculated at frontend
    status?: string | null
    initialScore?: number
    finalScore?: number
    reviewItems: ReviewItemInfo[]
    reviewerHandle?: string | null
    reviewerHandleColor?: string
    reviewerMaxRating?: number | null
    submitterHandle?: string | null
    submitterHandleColor?: string
    submitterMaxRating?: number | null
    reviewProgress?: number // this field is calculated at frontend
    scorecardId: string
    resourceId: string
    committed: boolean
}

/**
 * Update review info to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustReviewInfo(data: ReviewInfo): ReviewInfo {
    const createdAtDate = parseDateValue(data.createdAt)
    const updatedAtDate = parseDateValue(data.updatedAt)
    const reviewDate = parseDateValue(data.reviewDate)

    const createdAt = createdAtDate ?? data.createdAt
    const updatedAt = updatedAtDate ?? data.updatedAt

    const reviewItems = data.reviewItems.map(
        adjustReviewItemInfo,
    ) as ReviewItemInfo[]

    const reviewerHandle = normalizeReviewerHandle(data.reviewerHandle)
    const reviewerMaxRating = data.reviewerMaxRating ?? undefined
    const submitterHandle = normalizeReviewerHandle(data.submitterHandle)
    const submitterMaxRating = data.submitterMaxRating ?? undefined

    const createdAtString = formatDateStringWithFallback(
        createdAtDate,
        data.createdAt,
    )
    const updatedAtString = formatDateStringWithFallback(
        updatedAtDate,
        data.updatedAt,
    )

    return {
        ...data,
        createdAt,
        createdAtString,
        reviewDate,
        reviewDateString: resolveReviewDateString(
            reviewDate,
            data.reviewDateString,
            data.reviewDate,
        ),
        reviewerHandle,
        reviewerHandleColor: resolveRatingColor(
            reviewerMaxRating,
            reviewerHandle,
            data.reviewerHandleColor,
        ),
        reviewerMaxRating,
        reviewItems,
        reviewProgress: calculateReviewItemInfoProgress(reviewItems),
        submitterHandle,
        submitterHandleColor: resolveRatingColor(
            submitterMaxRating,
            submitterHandle,
            data.submitterHandleColor,
        ),
        submitterMaxRating,
        updatedAt,
        updatedAtString,
    }
}

/**
 * Convert backend submission info to show in ui
 *
 * @param data data from backend response
 * @returns updated data
 */
export function convertBackendReviewToReviewInfo(
    data: BackendReview,
): ReviewInfo {
    const createdAtDate = parseDateValue(data.createdAt)
    const updatedAtDate = parseDateValue(data.updatedAt)
    const reviewDate = parseDateValue(data.reviewDate)
    const reviewItems = data.reviewItems ?? []
    const reviewItemsInfo = reviewItems.map(convertBackendReviewItem)
    const reviewerHandle = normalizeReviewerHandle(data.reviewerHandle)
    const reviewerMaxRating = data.reviewerMaxRating ?? undefined
    const submitterHandle = normalizeReviewerHandle(data.submitterHandle)
    const submitterMaxRating = data.submitterMaxRating ?? undefined

    return {
        committed: data.committed,
        createdAt: createdAtDate ?? '',
        createdAtString: formatDateString(createdAtDate),
        finalScore: data.finalScore,
        id: data.id,
        initialScore: data.initialScore,
        resourceId: data.resourceId,
        reviewDate,
        reviewDateString: formatOptionalDateString(reviewDate),
        reviewerHandle,
        reviewerHandleColor: reviewerMaxRating && reviewerHandle
            ? getRatingColor(reviewerMaxRating)
            : undefined,
        reviewerMaxRating,
        reviewItems: reviewItemsInfo,
        reviewProgress: calculateReviewProgress(reviewItems),
        scorecardId: data.scorecardId ?? '',
        status: data.status,
        submitterHandle,
        submitterHandleColor: submitterMaxRating && submitterHandle
            ? getRatingColor(submitterMaxRating)
            : undefined,
        submitterMaxRating,
        updatedAt: updatedAtDate ?? '',
        updatedAtString: formatDateString(updatedAtDate),
    }
}

/**
 * Convert backend submission info to show in ui
 *
 * @param data scorecard info
 * @param resourceId resource id
 * @returns review info
 */
export function createEmptyReviewInfoFromScorecard(
    data: ScorecardInfo,
    resourceId: string,
): ReviewInfo {
    const reviewItems: ReviewItemInfo[] = []
    forEach(data.scorecardGroups, group => {
        forEach(group.sections, section => {
            forEach(section.questions, (question: ScorecardQuestion) => {
                reviewItems.push({
                    createdAt: '',
                    id: `${reviewItems.length}`,
                    reviewItemComments: [
                        {
                            content: '',
                            id: '1',
                            sortOrder: 1,
                            type: '',
                        },
                    ],
                    scorecardQuestionId: question.id ?? '',
                })
            })
        })
    })

    return {
        committed: false,
        createdAt: '',
        resourceId,
        reviewItems,
        scorecardId: data.id,
        updatedAt: '',
    }
}
