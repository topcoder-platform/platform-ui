import { filter, reduce } from 'lodash'

import {
    ReviewItemInfo,
    Scorecard,
    ScorecardInfo,
} from '../../../models'
import { roundWith2DecimalPlaces } from '../../../utils'

/**
 * Normalize scorecard question ID for consistent comparison
 */
export const normalizeScorecardQuestionId = (
    id?: string | null,
): string | undefined => {
    if (id === undefined || id === null) {
        return undefined
    }

    const normalized = `${id}`.trim()
        .toLowerCase()

    return normalized || undefined
}

/**
 * Create mapping of review items by normalized question ID
 */
export const createReviewItemMapping = (
    reviewItems: ReviewItemInfo[],
): {
    [key: string]: {
        item: ReviewItemInfo
        index: number
    }
} => {
    const result: {
        [key: string]: {
            item: ReviewItemInfo
            index: number
        }
    } = {}

    reviewItems.forEach((item, index) => {
        const normalizedId = normalizeScorecardQuestionId(
            item.scorecardQuestionId,
        )
        if (normalizedId) {
            result[normalizedId] = {
                index,
                item,
            }
        }
    })

    return result
}

export interface ProgressAndScore {
    reviewProgress: number;
    totalScore: number;
    scoreMap: Map<string, number>
}

/**
 * Calculate progress and score from review form data
 */
export const calculateProgressAndScore = (
    reviewFormDatas: {scorecardQuestionId: string; initialAnswer: string;}[],
    scorecard: Scorecard | ScorecardInfo,
): ProgressAndScore => {
    const scoreMap = new Map<string, number>()

    if (!scorecard || reviewFormDatas.length === 0) {
        return { reviewProgress: 0, scoreMap, totalScore: 0 }
    }

    const mappingResult: {
        [scorecardQuestionId: string]: string | number
    } = {}

    const newReviewProgress = Math.round(
        (filter(reviewFormDatas, review => {
            const normalizedId = normalizeScorecardQuestionId(
                review.scorecardQuestionId,
            )
            if (normalizedId) {
                mappingResult[normalizedId] = review.initialAnswer
            }

            return !!review.initialAnswer
        }).length
        * 100)
        / reviewFormDatas.length,
    )

    const groupsScore = reduce(
        scorecard.scorecardGroups ?? [],
        (groupResult, group) => {
            const groupPoint = (reduce(
                group.sections ?? [],
                (sectionResult, section) => {
                    const sectionPoint = (reduce(
                        section.questions ?? [],
                        (questionResult, question) => {
                            let questionPoint = 0
                            const normalizedQuestionId = normalizeScorecardQuestionId(
                                question.id as string,
                            )
                            const initialAnswer = normalizedQuestionId
                                ? mappingResult[normalizedQuestionId]
                                : undefined

                            if (
                                question.type === 'YES_NO'
                                && (initialAnswer === 'Yes' || initialAnswer === 1)
                            ) {
                                questionPoint = 100
                            } else if (
                                question.type === 'SCALE'
                                && !!initialAnswer
                            ) {
                                const totalPoint = question.scaleMax
                                const initialAnswerNumber = parseInt(initialAnswer as string, 10)
                                questionPoint = totalPoint > 0
                                    ? (initialAnswerNumber * 100) / totalPoint
                                    : 0
                            }

                            const score = (questionPoint * question.weight) / 100
                            scoreMap.set(question.id as string, score)
                            return questionResult + score
                        },
                        0,
                    ) * section.weight) / 100
                    scoreMap.set(section.id as string, sectionPoint)
                    return sectionResult + sectionPoint
                },
                0,
            ) * group.weight) / 100
            scoreMap.set(group.id as string, groupPoint)
            return groupResult + groupPoint
        },
        0,
    )

    return {
        reviewProgress: newReviewProgress,
        scoreMap,
        totalScore: roundWith2DecimalPlaces(groupsScore),
    }
}
