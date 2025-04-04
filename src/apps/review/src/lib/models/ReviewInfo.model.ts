import _ from 'lodash'
import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

import { adjustReviewItemInfo, ReviewItemInfo } from './ReviewItemInfo.model'
import { AppealResult } from './AppealResult.model'

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
export function adjustReviewInfo(
    data: ReviewInfo | undefined,
): ReviewInfo | undefined {
    if (!data) {
        return data
    }

    const createdAt = data.createdAt ? new Date(data.createdAt) : data.createdAt
    const updatedAt = data.updatedAt ? new Date(data.updatedAt) : data.updatedAt

    const reviewItems = data.reviewItems.map(
        adjustReviewItemInfo,
    ) as ReviewItemInfo[]
    const totalNumberOfQuestions = reviewItems.length
    const numberOfQuestionsHaveBeenFilled = _.filter(
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
