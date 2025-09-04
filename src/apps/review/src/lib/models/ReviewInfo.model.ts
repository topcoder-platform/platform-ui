import { filter } from 'lodash'
import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'
import { MockAppealResults, MockReviewEdit } from '../../mock-datas'

import { adjustReviewItemInfo, ReviewItemInfo } from './ReviewItemInfo.model'
import { AppealResult } from './AppealResult.model'
import { BackendSubmission } from './BackendSubmission.model'
import {
    convertBackendReviewToReviewResult,
    ReviewResult,
} from './ReviewResult.model'
import { BackendReview } from './BackendReview.model'

/**
 * Review info
 */
export interface ReviewInfo {
    id: string
    createdAt: string | Date
    createdAtString?: string // this field is calculated at frontend
    updatedAt: string | Date
    updatedAtString?: string // this field is calculated at frontend
    initialScore?: number
    finalScore?: number
    reviewItems: ReviewItemInfo[]
    reviewProgress?: number // this field is calculated at frontend
    scorecardId: string
    appealResuls: AppealResult[]
}

/**
 * Update review info to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustReviewInfo(data: ReviewInfo): ReviewInfo {
    const createdAt = data.createdAt ? new Date(data.createdAt) : data.createdAt
    const updatedAt = data.updatedAt ? new Date(data.updatedAt) : data.updatedAt

    const reviewItems = data.reviewItems.map(
        adjustReviewItemInfo,
    ) as ReviewItemInfo[]
    const totalNumberOfQuestions = reviewItems.length
    const numberOfQuestionsHaveBeenFilled = filter(
        reviewItems,
        item => !!item.initialAnswer,
    ).length

    return {
        ...data,
        createdAt,
        createdAtString: data.createdAt
            ? moment(data.createdAt)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.createdAt,
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
 * Convert backend submission info to show in review table
 *
 * @param data data from backend response
 * @returns updated data
 */
export function convertBackendReviewToReviewInfo(
    data: BackendReview,
    submission: BackendSubmission,
): ReviewInfo {
    const createdAt = new Date(data.createdAt)
    const createdAtString = createdAt
        ? moment(createdAt)
            .local()
            .format(TABLE_DATE_FORMAT)
        : undefined
    const updatedAt = new Date(data.updatedAt)
    const updatedAtString = createdAt
        ? moment(updatedAt)
            .local()
            .format(TABLE_DATE_FORMAT)
        : undefined

    const reviewItems = submission.review.map(
        convertBackendReviewToReviewResult,
    ) as ReviewResult[]
    const totalNumberOfQuestions = reviewItems.length
    const numberOfQuestionsHaveBeenFilled = filter(
        reviewItems,
        item => !!item.score,
    ).length

    return {
        appealResuls: MockAppealResults, // use mock data
        createdAt,
        createdAtString,
        finalScore: data.finalScore,
        id: data.id,
        initialScore: data.initialScore,
        reviewItems: MockReviewEdit.reviewItems.map(adjustReviewItemInfo),
        // Be calculated by the frontend,
        // the percentage = (The number of questions that have been filled / The total number of questions).
        reviewProgress: totalNumberOfQuestions
            ? Math.round(
                (numberOfQuestionsHaveBeenFilled * 100)
                / totalNumberOfQuestions,
            )
            : 0,
        scorecardId: '',
        updatedAt,
        updatedAtString,
    }
}
