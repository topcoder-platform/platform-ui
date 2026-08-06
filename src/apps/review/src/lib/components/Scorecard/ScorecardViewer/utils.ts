import { filter, reduce } from 'lodash'

import {
    FormReviews,
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

/**
 * Fill supported review answers with the maximum value defined by the scorecard.
 * The review viewer uses this for its Fill Scorecard action. Review metadata,
 * comments, existing answers, unmatched items, and unsupported question types
 * remain unchanged.
 *
 * @param reviewFormData - Current review form values.
 * @param scorecard - Scorecard whose questions define the maximum answers.
 * @returns A copy of the form values with unanswered YES_NO questions set to
 * Yes and unanswered SCALE questions set to their maximum numeric value. This
 * function does not throw for unsupported question types.
 */
export const fillScorecardWithMaximumAnswers = (
    reviewFormData: FormReviews,
    scorecard: Scorecard | ScorecardInfo,
): FormReviews => {
    const maximumAnswers = new Map<string, string>()

    scorecard.scorecardGroups.forEach(group => {
        group.sections.forEach(section => {
            section.questions.forEach(question => {
                const normalizedQuestionId = normalizeScorecardQuestionId(question.id)

                if (!normalizedQuestionId) {
                    return
                }

                if (question.type === 'YES_NO') {
                    maximumAnswers.set(normalizedQuestionId, 'Yes')
                } else if (
                    question.type === 'SCALE'
                    && question.scaleMax >= question.scaleMin
                ) {
                    maximumAnswers.set(normalizedQuestionId, String(question.scaleMax))
                }
            })
        })
    })

    return {
        ...reviewFormData,
        reviews: reviewFormData.reviews.map(review => {
            if (review.initialAnswer) {
                return review
            }

            const normalizedQuestionId = normalizeScorecardQuestionId(
                review.scorecardQuestionId,
            )
            const maximumAnswer = normalizedQuestionId
                ? maximumAnswers.get(normalizedQuestionId)
                : undefined

            return maximumAnswer === undefined
                ? review
                : {
                    ...review,
                    initialAnswer: maximumAnswer,
                }
        }),
    }
}

export interface ProgressAndScore {
    reviewProgress: number;
    totalScore: number;
    scoreMap: Map<string, number>
}

/**
 * Review answers come back as `Yes`/`No` from form controls and `YES`/`NO`
 * from persisted API data. Normalize both formats before applying score logic.
 */
const isAffirmativeYesNoAnswer = (
    answer?: string | number | null,
): boolean => {
    if (answer === undefined || answer === null) {
        return false
    }

    if (typeof answer === 'number') {
        return answer === 1
    }

    const normalizedAnswer = `${answer}`.trim()
        .toUpperCase()

    return normalizedAnswer === 'YES' || normalizedAnswer === '1'
}

/**
 * Calculate progress and score from review form data.
 * YES/NO answers are normalized so the viewer scores both UI (`Yes`) and
 * API (`YES`) representations consistently.
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
                                && isAffirmativeYesNoAnswer(initialAnswer)
                            ) {
                                questionPoint = 100
                            } else if (
                                question.type === 'SCALE'
                                && !!initialAnswer
                            ) {
                                const totalPoint = question.scaleMax - question.scaleMin
                                const initialAnswerNumber = parseInt(initialAnswer as string, 10) - question.scaleMin
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
