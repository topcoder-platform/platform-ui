/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { FC, useMemo } from 'react'
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'

import type {
    ChallengeDetailContextModel,
    FormReviews,
    ReviewItemInfo,
    ScorecardQuestion,
} from '../../../../../models'
import { ChallengeDetailContext } from '../../../../../contexts/ChallengeDetailContext'

import ScorecardQuestionEdit from './ScorecardQuestionEdit'

const mockUseScorecardViewerContext = jest.fn()

jest.mock('../../ScorecardViewer.context', () => ({
    useScorecardViewerContext: () => mockUseScorecardViewerContext(),
}))

jest.mock('../../../../../utils', () => ({
    getScoreResponseOptions: () => [{
        label: '10',
        value: '10',
    }],
}))

jest.mock('~/libs/ui', () => ({
    IconOutline: {
        ChevronDownIcon: () => <span />,
    },
}), { virtual: true })

jest.mock('~/apps/review/src/lib/assets/icons', () => ({
    IconComment: () => <span />,
}), { virtual: true })

jest.mock('../../../../FieldMarkdownEditor', () => ({
    FieldMarkdownEditor: () => <textarea />,
}))

jest.mock('../../../../MarkdownReview', () => ({
    MarkdownReview: () => <div />,
}))

const submissionPlaceQuestion: ScorecardQuestion = {
    description: 'Submission Place',
    guidelines: '',
    id: 'submission-place',
    requiresUpload: false,
    scaleMax: 10,
    scaleMin: 1,
    sortOrder: 0,
    type: 'SCALE',
    weight: 100,
}

const reviewItem: ReviewItemInfo = {
    createdAt: '2026-07-30T00:00:00.000Z',
    id: 'review-item-1',
    initialAnswer: '10',
    reviewItemComments: [],
    scorecardQuestionId: 'submission-place',
}

interface QuestionHarnessProps {
    question: ScorecardQuestion
    trackName: string
}

/**
 * Supplies the form, scorecard, and challenge contexts needed by an editable question.
 *
 * @param props.question scorecard question to render.
 * @param props.trackName challenge track name exposed by the challenge context.
 * @returns An editable scorecard question with realistic form state.
 * @throws This test component does not throw.
 */
const QuestionHarness: FC<QuestionHarnessProps> = props => {
    const form = useForm<FormReviews>({
        defaultValues: {
            reviews: [{
                comments: [],
                id: reviewItem.id,
                index: 0,
                initialAnswer: reviewItem.initialAnswer!,
                scorecardQuestionId: props.question.id!,
            }],
        },
    })
    const challengeContext = useMemo(
        () => ({
            challengeInfo: {
                track: {
                    name: props.trackName,
                },
            },
        } as unknown as ChallengeDetailContextModel),
        [props.trackName],
    )

    mockUseScorecardViewerContext.mockReturnValue({
        form,
        formErrors: {},
        formTrigger: form.trigger,
        isTouched: {},
        scoreMap: new Map([[props.question.id, 100]]),
        setIsTouched: jest.fn(),
        toggledItems: {},
        toggleItem: jest.fn(),
    })

    return (
        <ChallengeDetailContext.Provider value={challengeContext}>
            <ScorecardQuestionEdit
                fieldIndex={0}
                index='1.1.1'
                question={props.question}
                reviewItem={{
                    ...reviewItem,
                    scorecardQuestionId: props.question.id!,
                }}
            />
        </ChallengeDetailContext.Provider>
    )
}

describe('ScorecardQuestionEdit placement guidelines', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('explains placement ratings for a design Submission Place question', () => {
        render(
            <QuestionHarness
                question={submissionPlaceQuestion}
                trackName='Design'
            />,
        )

        const guidelines = screen.getByText(/10 - 1st place/i)

        expect(guidelines.textContent)
            .toContain('2 and 1 - no placement')
    })

    it('does not show placement ratings for a non-design challenge', () => {
        render(
            <QuestionHarness
                question={submissionPlaceQuestion}
                trackName='Development'
            />,
        )

        expect(screen.queryByText(/10 - 1st place/i))
            .toBeNull()
    })

    it('does not show placement ratings for another design scorecard question', () => {
        render(
            <QuestionHarness
                question={{
                    ...submissionPlaceQuestion,
                    description: 'Visual Quality',
                }}
                trackName='Design'
            />,
        )

        expect(screen.queryByText(/10 - 1st place/i))
            .toBeNull()
    })
})
