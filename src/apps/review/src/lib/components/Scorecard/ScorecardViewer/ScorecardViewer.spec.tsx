/* eslint-disable import/no-extraneous-dependencies */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import type {
    FormReviews,
    ReviewInfo,
    ScorecardInfo,
} from '../../../models'

import ScorecardViewer from './ScorecardViewer'

jest.mock('~/apps/admin/src/lib', () => ({
    TableLoading: () => <div>Loading</div>,
}), { virtual: true })

jest.mock('../../../utils', () => {
    const Yup: typeof import('yup') = jest.requireActual('yup')

    return {
        formReviewsSchema: Yup.object({
            reviews: Yup.array()
                .required(),
        }),
        roundWith2DecimalPlaces: (value: number): number => Math.round(value * 100) / 100,
    }
})

jest.mock('../../ConfirmModal', () => ({
    ConfirmModal: () => undefined,
}))

jest.mock('./ScorecardGroup', () => ({
    ScorecardGroup: () => undefined,
}))

jest.mock('./ScorecardTotal', () => ({
    ScorecardTotal: () => undefined,
}))

const scorecard: ScorecardInfo = {
    id: 'scorecard-1',
    minimumPassingScore: 50,
    name: 'Design Review',
    scorecardGroups: [{
        id: 'group-1',
        name: 'Review',
        sections: [{
            id: 'section-1',
            name: 'Review',
            questions: [
                {
                    description: 'Meets requirements',
                    guidelines: '',
                    id: 'yes-no-question',
                    requiresUpload: false,
                    scaleMax: 0,
                    scaleMin: 0,
                    sortOrder: 0,
                    type: 'YES_NO',
                    weight: 50,
                },
                {
                    description: 'Quality',
                    guidelines: '',
                    id: 'scale-question',
                    requiresUpload: false,
                    scaleMax: 5,
                    scaleMin: 1,
                    sortOrder: 1,
                    type: 'SCALE',
                    weight: 50,
                },
            ],
            sortOrder: 0,
            weight: 100,
        }],
        sortOrder: 0,
        weight: 100,
    }],
}

const reviewInfo: ReviewInfo = {
    committed: false,
    createdAt: '2026-07-30T00:00:00.000Z',
    resourceId: 'resource-1',
    reviewItems: [
        {
            createdAt: '2026-07-30T00:00:00.000Z',
            id: 'review-item-1',
            initialAnswer: '',
            reviewItemComments: [{
                content: 'Keep this comment',
                id: 'comment-1',
                sortOrder: 0,
                type: 'COMMENT',
            }],
            scorecardQuestionId: 'yes-no-question',
        },
        {
            createdAt: '2026-07-30T00:00:00.000Z',
            id: 'review-item-2',
            initialAnswer: '2',
            reviewItemComments: [],
            scorecardQuestionId: 'scale-question',
        },
    ],
    scorecardId: 'scorecard-1',
    updatedAt: '2026-07-30T00:00:00.000Z',
}

describe('ScorecardViewer Fill Scorecard action', () => {
    it('fills unanswered selections and preserves existing answers and comments', async () => {
        const saveReviewInfo = jest.fn()

        render(
            <ScorecardViewer
                canFillScorecard
                isEdit
                reviewInfo={reviewInfo}
                saveReviewInfo={saveReviewInfo}
                scorecard={scorecard}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Fill Scorecard' }))
        fireEvent.click(screen.getByRole('button', { name: 'Save as Draft' }))

        await waitFor(() => {
            expect(saveReviewInfo)
                .toHaveBeenCalledTimes(1)
        })

        const fullReview = saveReviewInfo.mock.calls[0][1] as FormReviews

        expect(fullReview.reviews)
            .toEqual([
                expect.objectContaining({
                    comments: [expect.objectContaining({
                        content: 'Keep this comment',
                        id: 'comment-1',
                    })],
                    id: 'review-item-1',
                    initialAnswer: 'Yes',
                }),
                expect.objectContaining({
                    id: 'review-item-2',
                    initialAnswer: '2',
                }),
            ])
    })

    it('does not show the action without fill permission or edit access', () => {
        const view: ReturnType<typeof render> = render(
            <ScorecardViewer
                isEdit
                reviewInfo={reviewInfo}
                scorecard={scorecard}
            />,
        )

        expect(screen.queryByRole('button', { name: 'Fill Scorecard' }))
            .toBeNull()

        view.rerender(
            <ScorecardViewer
                canFillScorecard
                reviewInfo={reviewInfo}
                scorecard={scorecard}
            />,
        )

        expect(screen.queryByRole('button', { name: 'Fill Scorecard' }))
            .toBeNull()
    })
})
