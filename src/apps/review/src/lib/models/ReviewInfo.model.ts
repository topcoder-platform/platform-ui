import { filter, forEach } from 'lodash'
import moment from 'moment'

import { TABLE_DATE_FORMAT } from '../../config/index.config'

import { adjustReviewItemInfo, ReviewItemInfo } from './ReviewItemInfo.model'
import { BackendReview } from './BackendReview.model'
import { convertBackendReviewItem } from './BackendReviewItem.model'
import { ScorecardInfo } from './ScorecardInfo.model'
import { ScorecardQuestion } from './ScorecardQuestion.model'

/**
 * Review info
 */
export interface ReviewInfo {
    id?: string
    createdAt: string | Date
    createdAtString?: string // this field is calculated at frontend
    updatedAt: string | Date
    updatedAtString?: string // this field is calculated at frontend
    initialScore?: number
    finalScore?: number
    reviewItems: ReviewItemInfo[]
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
 * Convert backend submission info to show in ui
 *
 * @param data data from backend response
 * @returns updated data
 */
export function convertBackendReviewToReviewInfo(
    data: BackendReview,
): ReviewInfo {
    const createdAt = data.createdAt ? new Date(data.createdAt) : ''
    const createdAtString = createdAt
        ? moment(createdAt)
            .local()
            .format(TABLE_DATE_FORMAT)
        : ''
    const updatedAt = data.updatedAt ? new Date(data.updatedAt) : ''
    const updatedAtString = createdAt
        ? moment(updatedAt)
            .local()
            .format(TABLE_DATE_FORMAT)
        : ''

    const reviewItems = data.reviewItems ?? []
    const totalNumberOfQuestions = reviewItems.length
    const numberOfQuestionsHaveBeenFilled = filter(
        reviewItems,
        item => !!item.initialAnswer,
    ).length

    return {
        committed: data.committed,
        createdAt,
        createdAtString,
        finalScore: data.finalScore,
        id: data.id,
        initialScore: data.initialScore,
        resourceId: data.resourceId,
        reviewItems: (data.reviewItems ?? []).map(convertBackendReviewItem),
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
