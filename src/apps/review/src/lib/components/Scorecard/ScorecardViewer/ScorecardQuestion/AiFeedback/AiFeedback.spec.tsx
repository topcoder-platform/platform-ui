/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import type { ScorecardQuestion } from '../../../../../models'

import AiFeedback from './AiFeedback'

const mockHandleError = jest.fn()
const mockMutate = jest.fn()
const mockToastSuccess = jest.fn()
const mockUpdateRunItemScore = jest.fn()
const mockUseReviewsContext = jest.fn()
const mockUseScorecardViewerContext = jest.fn()

jest.mock('react-toastify', () => ({
    toast: {
        success: (...args: unknown[]) => mockToastSuccess(...args),
    },
}))

jest.mock('swr', () => ({
    mutate: (...args: unknown[]) => mockMutate(...args),
}))

jest.mock('~/apps/review/src/lib/assets/icons', () => ({
    IconAiReview: () => <span />,
}), { virtual: true })

jest.mock('~/apps/review/src/lib/services', () => ({
    createFeedbackComment: jest.fn(),
    updateRunItemScore: (...args: unknown[]) => mockUpdateRunItemScore(...args),
}), { virtual: true })

jest.mock('~/apps/review/src/lib/services/aiReview.service', () => ({
    getAiReviewDecisionsCacheKey: (configId: string) => `decisions-${configId}`,
}), { virtual: true })

jest.mock('~/apps/review/src/lib/hooks/useFetchAiWorkflowRuns', () => ({
    AiWorkflowReviewMethod: {
        DETERMINISTIC: 'DETERMINISTIC',
    },
    getAiWorkflowRunsCacheKey: (submissionId: string) => `runs-${submissionId}`,
}), { virtual: true })

jest.mock('~/apps/review/src/pages/reviews/ReviewsContext', () => ({
    useReviewsContext: () => mockUseReviewsContext(),
}), { virtual: true })

jest.mock('~/apps/review/src/lib/utils', () => ({
    getScoreResponseOptions: () => [
        {
            label: '3',
            value: '3',
        },
        {
            label: '4',
            value: '4',
        },
    ],
}), { virtual: true })

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: {
            V6: 'https://api.test/v6',
        },
    },
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: (props: { label: string, onClick: () => void }) => (
        <button type='button' onClick={props.onClick}>{props.label}</button>
    ),
    IconOutline: {},
    Tooltip: (props: { children: JSX.Element }) => props.children,
}), { virtual: true })

jest.mock('~/apps/review/src/lib/hooks', () => ({
    useRole: () => ({
        isPrivilegedRole: true,
    }),
}), { virtual: true })

jest.mock('~/libs/shared/lib/utils/handle-error', () => ({
    handleError: (...args: unknown[]) => mockHandleError(...args),
}), { virtual: true })

jest.mock('../../ScorecardViewer.context', () => ({
    useScorecardViewerContext: () => mockUseScorecardViewerContext(),
}))

jest.mock('../ScorecardQuestionRow', () => ({
    ScorecardQuestionRow: (props: { children: JSX.Element }) => <div>{props.children}</div>,
}))

jest.mock('../../ScorecardScore', () => ({
    ScorecardScore: () => <span />,
}))

jest.mock('../../../../MarkdownReview', () => ({
    MarkdownReview: (props: { value: string }) => <div>{props.value}</div>,
}))

jest.mock('../AiFeedbackActions/AiFeedbackActions', () => ({
    AiFeedbackActions: () => <div />,
}))

jest.mock('../AiFeedbackComments/AiFeedbackComments', () => ({
    AiFeedbackComments: () => <div />,
}))

jest.mock('../AiFeedbackReply/AiFeedbackReply', () => ({
    AiFeedbackReply: (props: {
        onSubmitReply: (content: string) => Promise<void>
        submitLabel?: string
    }) => (
        <button
            type='button'
            onClick={function onClick() {
                props.onSubmitReply('  changing the score  ')
            }}
        >
            {props.submitLabel ?? 'Submit Reply'}
        </button>
    ),
}))

const question = {
    description: 'Code quality',
    guidelines: '',
    id: 'question-1',
    requiresUpload: false,
    scaleMax: 5,
    scaleMin: 1,
    sortOrder: 1,
    type: 'SCALE',
    weight: 100,
} as ScorecardQuestion

/**
 * Renders the AI feedback row, opens score editing, picks a new score and saves it.
 *
 * @returns Resolves once the save button has been clicked.
 * @throws Fails the test when the edit controls are not rendered.
 */
const editAndSaveScore = async (): Promise<void> => {
    render(<AiFeedback question={question} />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
}

describe('AiFeedback score editing in the Approval phase', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockMutate.mockResolvedValue(undefined)
        mockUseReviewsContext.mockReturnValue({
            aiReviewConfig: { id: 'config-1' },
            challengeInfo: {
                phases: [{ isOpen: true, name: 'Approval' }],
            },
            submissionId: 'submission-1',
            workflowId: 'workflow-1',
            workflowRun: {
                id: 'run-1',
                status: 'COMPLETED',
                workflow: { reviewMethod: 'AI' },
            },
        })
        mockUseScorecardViewerContext.mockReturnValue({
            aiFeedbackItems: [{
                comments: [],
                content: 'AI feedback content',
                id: 'feedback-1',
                questionScore: 4,
                scorecardQuestionId: 'question-1',
            }],
            scoreMap: new Map([['question-1', 80]]),
        })
    })

    it('shows a success message after the edited score is saved', async () => {
        mockUpdateRunItemScore.mockResolvedValue(undefined)

        await editAndSaveScore()

        await waitFor(() => {
            expect(mockToastSuccess)
                .toHaveBeenCalledWith('Score updated successfully!')
        })
        expect(mockUpdateRunItemScore)
            .toHaveBeenCalledWith('workflow-1', 'run-1', 'feedback-1', {
                comment: 'changing the score',
                questionScore: 3,
            })
        expect(mockHandleError)
            .not.toHaveBeenCalled()
        expect(screen.queryByRole('combobox'))
            .toBeNull()
    })

    it('shows an error message and no success message when saving the score fails', async () => {
        const error = new Error('Update failed')
        mockUpdateRunItemScore.mockRejectedValue(error)

        await editAndSaveScore()

        await waitFor(() => {
            expect(mockHandleError)
                .toHaveBeenCalledWith(error)
        })
        expect(mockToastSuccess)
            .not.toHaveBeenCalled()
        expect(screen.getByRole('combobox'))
            .toBeTruthy()
    })
})
