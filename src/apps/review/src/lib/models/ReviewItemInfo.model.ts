import _ from 'lodash'
import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

import {
    adjustReviewItemComment,
    ReviewItemComment,
} from './ReviewItemComment.model'

/**
 * Review item info
 */
export interface ReviewItemInfo {
    id: string
    createdAt: string | Date
    createdAtString?: string // this field is calculated at frontend
    initialAnswer?: string
    finalAnswer?: string
    scorecardQuestionId: string
    reviewItemComments: ReviewItemComment[]
}

/**
 * Update review item info to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustReviewItemInfo(
    data: ReviewItemInfo,
): ReviewItemInfo {
    if (!data) {
        return data
    }

    const createdAt = data.createdAt ? new Date(data.createdAt) : data.createdAt

    return {
        ...data,
        createdAt,
        createdAtString: data.createdAt
            ? moment(data.createdAt)
                .local()
                .format(TABLE_DATE_FORMAT)
            : data.createdAt,
        reviewItemComments: _.orderBy(
            data.reviewItemComments.map(
                adjustReviewItemComment,
            ) as ReviewItemComment[],
            ['sortOrder'],
            ['asc'],
        ),
    }
}
