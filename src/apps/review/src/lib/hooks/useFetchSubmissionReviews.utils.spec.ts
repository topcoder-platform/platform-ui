import { ReviewInfo, ScorecardInfo } from '../models'

import { applyAppealResponseScoreUpdate } from './useFetchSubmissionReviews.utils'

jest.mock('~/config', () => ({
    EnvironmentConfig: {},
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn()
        .mockReturnValue('#000000'),
}), { virtual: true })

const scorecardInfo: ScorecardInfo = {
    id: 'scorecard-1',
    minimumPassingScore: 70,
    name: 'Appeals Review Scorecard',
    scorecardGroups: [
        {
            id: 'group-1',
            name: 'Group 1',
            sections: [
                {
                    id: 'section-1',
                    name: 'Section 1',
                    questions: [
                        {
                            description: 'Question 1',
                            guidelines: '',
                            id: 'question-1',
                            requiresUpload: false,
                            scaleMax: 5,
                            scaleMin: 1,
                            sortOrder: 1,
                            type: 'SCALE',
                            weight: 100,
                        },
                    ],
                    sortOrder: 1,
                    weight: 100,
                },
            ],
            sortOrder: 1,
            weight: 100,
        },
    ],
}

const createReviewInfo = (): ReviewInfo => ({
    committed: true,
    createdAt: '2025-10-15T09:51:00.000Z',
    finalScore: 50,
    id: 'review-1',
    initialScore: 50,
    resourceId: 'resource-1',
    reviewItems: [
        {
            createdAt: '2025-10-15T09:51:00.000Z',
            finalAnswer: '3',
            id: 'review-item-1',
            initialAnswer: '3',
            reviewItemComments: [
                {
                    content: 'comment',
                    id: 'comment-1',
                    sortOrder: 1,
                    type: 'COMMENT',
                },
            ],
            scorecardQuestionId: 'question-1',
        },
    ],
    scorecardId: scorecardInfo.id,
    updatedAt: '2025-10-15T09:51:00.000Z',
})

describe('applyAppealResponseScoreUpdate', () => {
    it('updates the review answer and recalculates local score metadata', () => {
        const updatedReview = applyAppealResponseScoreUpdate(
            createReviewInfo(),
            'review-item-1',
            '4',
            scorecardInfo,
        )

        expect(updatedReview?.reviewItems[0].finalAnswer)
            .toBe('4')
        expect(updatedReview?.finalScore)
            .toBe(75)
        expect(updatedReview?.initialScore)
            .toBe(75)
        expect(updatedReview?.reviewProgress)
            .toBe(100)
    })

    it('still updates the review answer when scorecard metadata is unavailable', () => {
        const reviewInfo = createReviewInfo()
        const updatedReview = applyAppealResponseScoreUpdate(
            reviewInfo,
            'review-item-1',
            '4',
        )

        expect(updatedReview?.reviewItems[0].finalAnswer)
            .toBe('4')
        expect(updatedReview?.finalScore)
            .toBe(reviewInfo.finalScore)
        expect(updatedReview?.initialScore)
            .toBe(reviewInfo.initialScore)
    })

    it('returns undefined when there is no review to update', () => {
        expect(
            applyAppealResponseScoreUpdate(
                undefined,
                'review-item-1',
                '4',
                scorecardInfo,
            ),
        )
            .toBeUndefined()
    })
})
