import { filter, forEach } from 'lodash'
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
    const createdAt = data.createdAt ? new Date(data.createdAt) : data.createdAt
    const updatedAt = data.updatedAt ? new Date(data.updatedAt) : data.updatedAt
    const reviewDate = data.reviewDate ? new Date(data.reviewDate) : undefined

    const reviewItems = data.reviewItems.map(
        adjustReviewItemInfo,
    ) as ReviewItemInfo[]
    const totalNumberOfQuestions = reviewItems.length
    const numberOfQuestionsHaveBeenFilled = filter(
        reviewItems,
        item => !!item.initialAnswer,
    ).length

    const reviewerHandle = normalizeReviewerHandle(data.reviewerHandle)
    const reviewerMaxRating = data.reviewerMaxRating ?? undefined

    return {
        ...data,
        createdAt,
        createdAtString: data.createdAt
            ? moment(data.createdAt)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.createdAt,
        reviewDate,
        reviewDateString: reviewDate
            ? moment(reviewDate)
                .local()
                .format(TABLE_DATE_FORMAT)
            : (typeof data.reviewDateString === 'string'
                ? data.reviewDateString
                : typeof data.reviewDate === 'string'
                    ? data.reviewDate
                    : undefined),
        reviewerHandle,
        reviewerHandleColor: reviewerMaxRating && reviewerHandle
            ? getRatingColor(reviewerMaxRating)
            : data.reviewerHandleColor,
        reviewerMaxRating,
        reviewItems,
        // Be calculated by the frontend,
        // the percentage = (The number of questions that have been filled / The total number of questions).
        reviewProgress: totalNumberOfQuestions
            ? Math.round(
                (numberOfQuestionsHaveBeenFilled * 100)
                / totalNumberOfQuestions,
            )
            : 0,
        updatedAt,
        updatedAtString: data.updatedAt
            ? moment(data.updatedAt)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.updatedAt,
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
    const reviewerHandle = normalizeReviewerHandle(data.reviewerHandle)
    const reviewerMaxRating = data.reviewerMaxRating ?? undefined

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
        reviewItems: reviewItems.map(convertBackendReviewItem),
        reviewProgress: calculateReviewProgress(reviewItems),
        scorecardId: data.scorecardId ?? '',
        status: data.status,
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
