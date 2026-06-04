/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    FormProvider,
    useForm,
} from 'react-hook-form'

import {
    ChallengeEditorFormData,
    Reviewer,
} from '../../../../../lib/models'
import { patchChallenge } from '../../../../../lib/services'

import { ReviewersField } from './ReviewersField'

jest.mock('./HumanReviewTab', () => ({
    __esModule: true,
    default: () => <div data-testid='human-review-tab'>Human review content</div>,
}))
jest.mock('./AiReviewTab', () => ({
    __esModule: true,
    default: function AiReviewTabMock(
        props: {
            hasSubmissions?: boolean
            onConfigRemoved?: () => Promise<void> | void
            onConfigPersisted?: (config: unknown) => void
        },
    ) {
        function handleRemoveClick(): void {
            props.onConfigRemoved?.()
        }

        function handlePersistClick(): void {
            props.onConfigPersisted?.({
                id: 'config-1',
                challengeId: 'challenge-1',
                mode: 'AI_GATING',
                workflows: [],
                templateId: undefined,
                minPassingThreshold: 75,
                autoFinalize: false,
            })
        }

        return (
            <div data-testid='ai-review-tab'>
                {props.hasSubmissions
                    ? <div data-testid='ai-review-tab-read-only'>AI review locked</div>
                    : undefined}
                <button
                    onClick={handleRemoveClick}
                    type='button'
                >
                    Remove AI config
                </button>
                <button
                    onClick={handlePersistClick}
                    type='button'
                >
                    Persist AI config
                </button>
                AI review content
            </div>
        )
    },
}))
jest.mock('./ReviewConfigurationSummary', () => ({
    __esModule: true,
    default: () => <div data-testid='review-summary'>Review summary</div>,
}))
jest.mock('../../../../../lib/services', () => ({
    patchChallenge: jest.fn(),
}))

const mockedPatchChallenge = patchChallenge as jest.Mock

interface TestHarnessProps {
    isReadOnly?: boolean
    numOfSubmissions?: number
    reviewers: Reviewer[]
}

const TestHarness = (props: TestHarnessProps): JSX.Element => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            id: 'challenge-1',
            numOfSubmissions: props.numOfSubmissions,
            phases: [],
            reviewers: props.reviewers,
            trackId: 'track-id',
            typeId: 'type-id',
        },
    })
    const reviewersField = <ReviewersField isReadOnly={props.isReadOnly} />

    return (
        <FormProvider {...formMethods}>
            {reviewersField}
        </FormProvider>
    )
}

describe('ReviewersField', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedPatchChallenge.mockResolvedValue({})
    })

    it('uses tab labels with reviewer counts and toggles between human and AI content', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                reviewers={[
                    {
                        handle: 'human-1',
                        isMemberReview: true,
                        memberId: 'member-1',
                    },
                    {
                        handle: 'human-2',
                        isMemberReview: true,
                        memberId: 'member-2',
                    },
                    {
                        aiWorkflowId: 'workflow-1',
                        isMemberReview: false,
                    },
                ]}
            />,
        )

        expect(screen.getByRole('tab', { name: 'Human Review (2)' })
            .getAttribute('aria-selected'))
            .toBe('true')
        expect(screen.getByRole('tab', { name: 'AI Review (1)' })
            .getAttribute('aria-selected'))
            .toBe('false')
        expect(screen.getByTestId('human-review-tab').parentElement?.className)
            .not.toContain('tabPanelHidden')
        expect(screen.getByTestId('human-review-tab').parentElement?.hasAttribute('hidden'))
            .toBe(false)
        expect(screen.getByTestId('ai-review-tab').parentElement?.className)
            .toContain('tabPanelHidden')
        expect(screen.getByTestId('ai-review-tab').parentElement?.hasAttribute('hidden'))
            .toBe(true)

        await user.click(screen.getByRole('tab', { name: 'AI Review (1)' }))

        expect(screen.getByRole('tab', { name: 'Human Review (2)' })
            .getAttribute('aria-selected'))
            .toBe('false')
        expect(screen.getByRole('tab', { name: 'AI Review (1)' })
            .getAttribute('aria-selected'))
            .toBe('true')
        expect(screen.getByTestId('human-review-tab').parentElement?.className)
            .toContain('tabPanelHidden')
        expect(screen.getByTestId('human-review-tab').parentElement?.hasAttribute('hidden'))
            .toBe(true)
        expect(screen.getByTestId('ai-review-tab').parentElement?.className)
            .not.toContain('tabPanelHidden')
        expect(screen.getByTestId('ai-review-tab').parentElement?.hasAttribute('hidden'))
            .toBe(false)
    })

    it('removes AI reviewers from the form and challenge when the AI config is removed', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                reviewers={[
                    {
                        handle: 'human-1',
                        isMemberReview: true,
                        memberId: 'member-1',
                    },
                    {
                        aiWorkflowId: 'workflow-1',
                        isMemberReview: false,
                        phaseId: 'phase-1',
                        scorecardId: 'scorecard-1',
                    },
                ]}
            />,
        )

        await user.click(screen.getByRole('tab', { name: 'AI Review (1)' }))
        await user.click(screen.getByRole('button', { name: 'Remove AI config' }))

        expect(screen.getByRole('tab', { name: 'Human Review (1)' })).not.toBeNull()
        expect(screen.getByRole('tab', { name: 'AI Review (0)' })).not.toBeNull()
        expect(mockedPatchChallenge)
            .toHaveBeenCalledWith('challenge-1', {
                reviewers: [
                    {
                        handle: 'human-1',
                        isMemberReview: true,
                        memberId: 'member-1',
                    },
                ],
            })
    })

    it('shows only the summary in read-only mode', () => {
        render(
            <TestHarness
                isReadOnly
                reviewers={[
                    {
                        handle: 'human-1',
                        isMemberReview: true,
                        memberId: 'member-1',
                    },
                    {
                        aiWorkflowId: 'workflow-1',
                        isMemberReview: false,
                    },
                ]}
            />,
        )

        expect(screen.getByTestId('review-summary')).not.toBeNull()
        expect(screen.queryByRole('tablist'))
            .toBeNull()
        expect(screen.queryByTestId('human-review-tab'))
            .toBeNull()
        expect(screen.queryByTestId('ai-review-tab'))
            .toBeNull()
    })

    it('passes the submission lock state to the AI tab once submissions exist', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                numOfSubmissions={1}
                reviewers={[
                    {
                        handle: 'human-1',
                        isMemberReview: true,
                        memberId: 'member-1',
                    },
                    {
                        aiWorkflowId: 'workflow-1',
                        isMemberReview: false,
                    },
                ]}
            />,
        )

        await user.click(screen.getByRole('tab', { name: 'AI Review (1)' }))

        expect(screen.getByTestId('ai-review-tab-read-only')).not.toBeNull()
    })

    it('requires manual reviewer configuration when AI Review mode is AI GATING', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                reviewers={[]}
            />,
        )

        await user.click(screen.getByRole('tab', { name: 'AI Review (0)' }))
        await user.click(screen.getByRole('button', { name: 'Persist AI config' }))

        expect(screen.getByText(
            'Manual review configuration is required when AI Review mode is AI GATING.',
        )).toBeInTheDocument()
    })

    it('supports keyboard navigation between review tabs', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                reviewers={[
                    {
                        handle: 'human-1',
                        isMemberReview: true,
                        memberId: 'member-1',
                    },
                    {
                        aiWorkflowId: 'workflow-1',
                        isMemberReview: false,
                    },
                ]}
            />,
        )

        const humanTab = screen.getByRole('tab', { name: 'Human Review (1)' })
        const aiTab = screen.getByRole('tab', { name: 'AI Review (1)' })

        humanTab.focus()
        expect(document.activeElement)
            .toBe(humanTab)

        await user.keyboard('{ArrowRight}')

        expect(document.activeElement)
            .toBe(aiTab)
        expect(aiTab.getAttribute('aria-selected'))
            .toBe('true')
        expect(screen.getByTestId('ai-review-tab').parentElement?.hasAttribute('hidden'))
            .toBe(false)

        await user.keyboard('{ArrowLeft}')

        expect(document.activeElement)
            .toBe(humanTab)
        expect(humanTab.getAttribute('aria-selected'))
            .toBe('true')
        expect(screen.getByTestId('human-review-tab').parentElement?.hasAttribute('hidden'))
            .toBe(false)
    })
})
