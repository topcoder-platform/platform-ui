import type { FormReviews, ScorecardInfo } from '../../../models'

import {
    calculateProgressAndScore,
    fillScorecardWithMaximumAnswers,
} from './utils'

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

describe('fillScorecardWithMaximumAnswers', () => {
    it('fills unanswered supported questions and preserves existing review data', () => {
        const scorecard = buildScorecard()
        scorecard.scorecardGroups[0].sections[0].questions = [
            {
                ...scorecard.scorecardGroups[0].sections[0].questions[0],
                id: ' Yes-No-Question ',
            },
            {
                ...scorecard.scorecardGroups[0].sections[0].questions[1],
                id: 'scale-question',
                scaleMax: 5,
                scaleMin: 1,
                type: 'SCALE',
            },
            {
                description: 'Test case',
                guidelines: 'Test case',
                id: 'test-case-question',
                requiresUpload: false,
                scaleMax: 0,
                scaleMin: 0,
                sortOrder: 3,
                type: 'TEST_CASE',
                weight: 0,
            },
        ]
        const formData: FormReviews = {
            reviews: [
                {
                    comments: [],
                    id: 'scale-review',
                    index: 0,
                    initialAnswer: '',
                    scorecardQuestionId: 'SCALE-QUESTION',
                },
                {
                    comments: [{
                        content: 'Keep this comment',
                        id: 'comment-1',
                        index: 0,
                        type: 'COMMENT',
                    }],
                    id: 'yes-no-review',
                    index: 1,
                    initialAnswer: '',
                    scorecardQuestionId: 'yes-no-question',
                },
                {
                    comments: [],
                    id: 'test-case-review',
                    index: 2,
                    initialAnswer: 'Keep this answer',
                    scorecardQuestionId: 'test-case-question',
                },
                {
                    comments: [],
                    id: 'unmatched-review',
                    index: 3,
                    initialAnswer: 'Keep unmatched',
                    scorecardQuestionId: 'unmatched-question',
                },
                {
                    comments: [],
                    id: 'answered-scale-review',
                    index: 4,
                    initialAnswer: '2',
                    scorecardQuestionId: 'scale-question',
                },
                {
                    comments: [],
                    id: 'answered-yes-no-review',
                    index: 5,
                    initialAnswer: 'No',
                    scorecardQuestionId: 'yes-no-question',
                },
            ],
        }

        const result = fillScorecardWithMaximumAnswers(formData, scorecard)

        expect(result.reviews)
            .toEqual([
                {
                    ...formData.reviews[0],
                    initialAnswer: '5',
                },
                {
                    ...formData.reviews[1],
                    initialAnswer: 'Yes',
                },
                formData.reviews[2],
                formData.reviews[3],
                formData.reviews[4],
                formData.reviews[5],
            ])
        expect(formData.reviews.map(review => review.initialAnswer))
            .toEqual(['', '', 'Keep this answer', 'Keep unmatched', '2', 'No'])
    })
})
