import { AiFeedbackItem, ReviewItemInfo, ScorecardGroup, ScorecardSection } from '../../../models'

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
