import { SelectOption, ScorecardQuestion } from '../models'
import { QUESTION_YES_NO_OPTIONS } from '../../config/index.config'

export function getScoreResponseOptions(
    question?: ScorecardQuestion | null,
): SelectOption[] {
    if (!question) {
        return []
    }

    if (question.type === 'SCALE') {
        const length = question.scaleMax - question.scaleMin + 1

        if (length <= 0) {
            return []
        }

        return Array.from({ length }, (_, index) => ({
            label: String(question.scaleMin + index),
            value: String(question.scaleMin + index),
        }))
    }

    if (question.type === 'YES_NO') {
        return QUESTION_YES_NO_OPTIONS
    }

    return []
}
