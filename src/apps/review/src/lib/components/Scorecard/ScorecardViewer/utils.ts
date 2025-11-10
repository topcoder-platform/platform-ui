import { filter, reduce } from 'lodash'

import {
    AiFeedbackItem,
    FormReviews,
    ReviewItemInfo,
    Scorecard,
    ScorecardGroup,
    ScorecardInfo,
    ScorecardSection,
} from '../../../models'
import { roundWith2DecimalPlaces } from '../../../utils'

export const calcSectionScore = (
    section: ScorecardSection,
    feedbackItems: Pick<AiFeedbackItem, 'questionScore' | 'scorecardQuestionId'>[],
): number => {
    const feedbackItemsMap = Object.fromEntries(feedbackItems.map(r => [r.scorecardQuestionId, r]))

    return section.questions.reduce((sum, question) => (
        sum + (
            (feedbackItemsMap[question.id as string]?.questionScore ?? 0) / (question.scaleMax || 1)
        ) * (question.weight / 100)
    ), 0)
}

export const calcGroupScore = (
    group: ScorecardGroup,
    feedbackItems: Pick<AiFeedbackItem, 'questionScore' | 'scorecardQuestionId'>[],
): number => (
    group.sections.reduce((sum, section) => (
        sum + (
            calcSectionScore(section, feedbackItems)
        ) * (section.weight / 100)
    ), 0)
)

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
    progress: number;
    score: number;
}

/**
 * Calculate progress and score from review form data
 */
export const calculateProgressAndScore = (
    reviewFormDatas: FormReviews['reviews'],
    scorecard: Scorecard | ScorecardInfo,
): ProgressAndScore => {
    if (!scorecard || reviewFormDatas.length === 0) {
        return { progress: 0, score: 0 }
    }

    const mappingResult: {
        [scorecardQuestionId: string]: string
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
                                && initialAnswer === 'Yes'
                            ) {
                                questionPoint = 100
                            } else if (
                                question.type === 'SCALE'
                                && !!initialAnswer
                            ) {
                                const totalPoint = question.scaleMax - question.scaleMin
                                const initialAnswerNumber = parseInt(initialAnswer, 10) - question.scaleMin
                                questionPoint = totalPoint > 0
                                    ? (initialAnswerNumber * 100) / totalPoint
                                    : 0
                            }

                            return (
                                questionResult
                                    + (questionPoint * question.weight) / 100
                            )
                        },
                        0,
                    ) * section.weight) / 100
                    return sectionResult + sectionPoint
                },
                0,
            ) * group.weight) / 100
            return groupResult + groupPoint
        },
        0,
    )

    return {
        progress: newReviewProgress,
        score: roundWith2DecimalPlaces(groupsScore),
    }
}
