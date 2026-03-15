import type { ScorecardInfo } from '../../../models'

import { calculateProgressAndScore } from './utils'

jest.mock('../../../utils', () => ({
    roundWith2DecimalPlaces: (value: number): number => Math.round(value * 100) / 100,
}))

const buildScorecard = (): ScorecardInfo => ({
    id: 'scorecard-1',
    minimumPassingScore: 98,
    name: 'Topgear - Standard Task Review Scorecard',
    scorecardGroups: [
        {
            id: 'group-1',
            name: 'Review',
            sections: [
                {
                    id: 'section-1',
                    name: 'Review',
                    questions: [
                        {
                            description: 'Question 1',
                            guidelines: 'Question 1',
                            id: 'question-1',
                            requiresUpload: false,
                            scaleMax: 0,
                            scaleMin: 0,
                            sortOrder: 1,
                            type: 'YES_NO',
                            weight: 50,
                        },
                        {
                            description: 'Question 2',
                            guidelines: 'Question 2',
                            id: 'question-2',
                            requiresUpload: false,
                            scaleMax: 0,
                            scaleMin: 0,
                            sortOrder: 2,
                            type: 'YES_NO',
                            weight: 50,
                        },
                    ],
                    sortOrder: 1,
                    weight: 100,
                },
            ],
            sortOrder: 1,
            weight: 98,
        },
    ],
})

describe('calculateProgressAndScore', () => {
    it('scores uppercase YES answers from persisted reviews as full marks', () => {
        const result = calculateProgressAndScore([
            {
                initialAnswer: 'YES',
                scorecardQuestionId: 'question-1',
            },
            {
                initialAnswer: 'YES',
                scorecardQuestionId: 'question-2',
            },
        ], buildScorecard())

        expect(result.reviewProgress)
            .toBe(100)
        expect(result.scoreMap.get('question-1'))
            .toBe(50)
        expect(result.scoreMap.get('question-2'))
            .toBe(50)
        expect(result.scoreMap.get('section-1'))
            .toBe(100)
        expect(result.scoreMap.get('group-1'))
            .toBe(98)
        expect(result.totalScore)
            .toBe(98)
    })
})
