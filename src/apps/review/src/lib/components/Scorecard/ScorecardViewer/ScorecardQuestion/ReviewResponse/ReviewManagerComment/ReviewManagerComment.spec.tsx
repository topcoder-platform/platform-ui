/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen, waitFor } from '@testing-library/react'

import type {
    ReviewItemInfo,
    ScorecardQuestion,
} from '../../../../../../models'
import type { ScorecardViewerContextValue } from '../../../ScorecardViewer.context'

import ReviewManagerComment from './ReviewManagerComment'

const mockUseScorecardViewerContext = jest.fn()

jest.mock('../../../ScorecardViewer.context', () => ({
    useScorecardViewerContext: () => mockUseScorecardViewerContext(),
}))

jest.mock('~/apps/review/src/lib/assets/icons', () => ({
    IconPhaseReview: () => <span />,
}), { virtual: true })

jest.mock('../../../../../../utils', () => {
    const Yup: typeof import('yup') = jest.requireActual('yup')

    return {
        formManagerCommentSchema: Yup.object({
            finalScore: Yup.string()
                .required(),
            response: Yup.string()
                .required(),
        }),
        getScoreResponseOptions: () => [
            {
                label: '9',
                value: '9',
            },
        ],
    }
})

jest.mock('../../../../../FieldMarkdownEditor', () => ({
    FieldMarkdownEditor: () => <textarea aria-label='Manager comment response' />,
}))

jest.mock('../../../../../MarkdownReview', () => ({
    MarkdownReview: (props: { value: string }) => <div>{props.value}</div>,
}))

const reviewItem = {
    createdAt: '2026-07-29T00:00:00.000Z',
    id: 'review-item-1',
    initialAnswer: '9',
    reviewItemComments: [],
    scorecardQuestionId: 'question-1',
} as ReviewItemInfo

const scorecardQuestion = {
    description: 'Submission Place',
    guidelines: '',
    id: 'question-1',
    requiresUpload: false,
    scaleMax: 10,
    scaleMin: 1,
    sortOrder: 1,
    type: 'SCALE',
    weight: 100,
} as ScorecardQuestion

/**
 * Builds the manager-edit context used to test score override visibility.
 *
 * @param autoOpenManagerComment Whether scorecard edit mode should open the form.
 * @param isManagerEdit Whether manager editing controls are enabled.
 * @returns The scorecard viewer context for the requested editing state.
 * @throws This test helper does not throw.
 */
const managerContext = (
    autoOpenManagerComment: boolean,
    isManagerEdit = true,
): ScorecardViewerContextValue => ({
    addManagerComment: jest.fn(),
    autoOpenManagerComment,
    canAddManagerComment: true,
    isManagerEdit,
    isSavingManagerComment: false,
} as unknown as ScorecardViewerContextValue)

describe('ReviewManagerComment score override form', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('opens for scorecard editing but remains collapsed for appeal response mode', async () => {
        mockUseScorecardViewerContext.mockReturnValue(managerContext(false))
        const rendered = render(
            <ReviewManagerComment
                reviewItem={reviewItem}
                scorecardQuestion={scorecardQuestion}
            />,
        )

        expect(screen.getByRole('button', { name: 'Add a Manager Comment' }))
            .toBeTruthy()
        expect(screen.queryByRole('combobox'))
            .toBeNull()

        mockUseScorecardViewerContext.mockReturnValue(managerContext(true))
        rendered.rerender(
            <ReviewManagerComment
                reviewItem={reviewItem}
                scorecardQuestion={scorecardQuestion}
            />,
        )

        await waitFor(() => {
            expect(screen.getByRole('combobox'))
                .toBeTruthy()
        })
        expect(screen.getByRole('button', { name: 'Submit Response' }))
            .toBeTruthy()

        mockUseScorecardViewerContext.mockReturnValue(managerContext(false, false))
        rendered.rerender(
            <ReviewManagerComment
                reviewItem={reviewItem}
                scorecardQuestion={scorecardQuestion}
            />,
        )

        await waitFor(() => {
            expect(screen.queryByRole('combobox'))
                .toBeNull()
        })
    })
})
