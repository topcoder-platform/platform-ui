import { AiFeedbackItem, ScorecardGroup, ScorecardSection } from '../../../models'

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
