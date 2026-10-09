/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    FormProvider,
    useForm,
} from 'react-hook-form'

import {
    Challenge,
    ChallengeEditorFormData,
    Reviewer,
} from '../../../../../lib/models'

import * as services from '../../../../../lib/services'
import { ReviewersField } from './ReviewersField'

jest.mock('../../../../../lib/services', () => ({
    __esModule: true,
    fetchAiReviewConfigByChallenge: jest.fn()
        .mockResolvedValue(undefined),
    fetchChallenge: jest.fn()
        .mockResolvedValue({ reviewers: [] }),
    patchChallenge: jest.fn(),
}))

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
    }) => (
        <button
            disabled={props.disabled}
            onClick={props.onClick}
            type='button'
        >
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})

jest.mock('./HumanReviewTab', () => ({
    __esModule: true,
    default: (props: { screenerOnly?: boolean }) => (
        <div
            data-screener-only={props.screenerOnly === true ? 'true' : 'false'}
            data-testid='human-review-tab'
        >
            Human review content
        </div>
    ),
}))
jest.mock('./AiReviewTab', () => ({
    __esModule: true,
    default: function AiReviewTabMock(
        props: {
            hasSubmissions?: boolean
            onConfigRemoved?: () => Promise<void> | void
            onConfigPersisted?: (config: unknown) => void
            onSelectedModeChange?: (mode: string | undefined) => void
        },
    ) {
        function handleRemoveClick(): void {
            props.onConfigRemoved?.()
        }

        function handleSelectAiOnlyClick(): void {
            props.onSelectedModeChange?.('AI_ONLY')
        }

        function handleSelectAiGatingClick(): void {
            props.onSelectedModeChange?.('AI_GATING')
        }

        function handlePersistAiOnlyClick(): void {
            props.onConfigPersisted?.({
                autoFinalize: false,
                challengeId: 'challenge-1',
                id: 'config-1',
                minPassingThreshold: 75,
                mode: 'AI_ONLY',
                templateId: undefined,
                workflows: [],
            })
        }

        function handlePersistClick(): void {
            props.onConfigPersisted?.({
                autoFinalize: false,
                challengeId: 'challenge-1',
                id: 'config-1',
                minPassingThreshold: 75,
                mode: 'AI_GATING',
                templateId: undefined,
                workflows: [],
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
                <button
                    onClick={handlePersistAiOnlyClick}
                    type='button'
                >
                    Persist AI only config
                </button>
                <button
                    onClick={handleSelectAiOnlyClick}
                    type='button'
                >
                    Select AI only mode
                </button>
                <button
                    onClick={handleSelectAiGatingClick}
                    type='button'
                >
                    Select AI gating mode
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
jest.mock('./ReviewContextTab', () => ({
    __esModule: true,
    ReviewContextTab: () => <div data-testid='review-context-tab'>Review context content</div>,
}))

const mockedPatchChallenge = jest.spyOn(services, 'patchChallenge')
    .mockResolvedValue({} as any)
const mockedFetchAiReviewConfigByChallenge = services.fetchAiReviewConfigByChallenge as jest.Mock

interface TestHarnessProps {
    canConfigureFullReview?: boolean
    isReadOnly?: boolean
    numOfSubmissions?: number
    phases?: ChallengeEditorFormData['phases']
    reviewers: Reviewer[]
    screenerOnly?: boolean
    status?: string
}

const AI_ONLY_TIMELINE_PHASES: ChallengeEditorFormData['phases'] = [
    {
        id: 'challenge-phase-registration',
        name: 'Registration',
        phaseId: 'phase-registration',
    },
    {
        id: 'challenge-phase-submission',
        name: 'Submission',
        phaseId: 'phase-submission',
    },
    {
        id: 'challenge-phase-ai-review',
        name: 'AI Review',
        phaseId: 'phase-ai-review',
    },
    {
        id: 'challenge-phase-approval',
        name: 'Approval',
        phaseId: 'phase-approval',
    },
]
const DEFAULT_TIMELINE_CHALLENGE = {
    phases: [
        {
            duration: 86400,
            id: 'challenge-phase-registration-2',
            name: 'Registration',
            phaseId: 'phase-registration',
        },
        {
            duration: 86400,
            id: 'challenge-phase-submission-2',
            name: 'Submission',
            phaseId: 'phase-submission',
        },
        {
            duration: 86400,
            id: 'challenge-phase-review-2',
            name: 'Review',
            phaseId: 'phase-review',
        },
        {
            duration: 86400,
            id: 'challenge-phase-approval-2',
            name: 'Approval',
            phaseId: 'phase-approval',
        },
    ],
    timelineTemplateId: 'default-timeline-template',
} as Challenge

const TestHarness = (props: TestHarnessProps): JSX.Element => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            id: 'challenge-1',
            numOfSubmissions: props.numOfSubmissions,
            phases: props.phases || [],
            reviewers: props.reviewers,
            status: props.status,
            timelineTemplateId: props.phases
                ? 'ai-only-timeline-template'
                : undefined,
            trackId: 'track-id',
            typeId: 'type-id',
        },
    })
    const reviewersField = (
        <ReviewersField
            canConfigureFullReview={props.canConfigureFullReview}
            isReadOnly={props.isReadOnly}
            screenerOnly={props.screenerOnly}
        />
    )

    const reviewersFormError = formMethods.formState.errors.reviewers?.message
    const formPhaseNames = (formMethods.watch('phases') || [])
        .map(phase => phase.name)
        .join(',')
    const formTimelineTemplateId = formMethods.watch('timelineTemplateId')

    return (
        <FormProvider {...formMethods}>
            {reviewersField}
            {reviewersFormError
                ? <div data-testid='reviewers-form-error'>{reviewersFormError}</div>
                : undefined}
            <div data-testid='form-phases'>{formPhaseNames}</div>
            <div data-testid='form-timeline-template'>{formTimelineTemplateId}</div>
        </FormProvider>
    )
}

describe('ReviewersField', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedFetchAiReviewConfigByChallenge.mockResolvedValue(undefined)
        mockedPatchChallenge.mockResolvedValue({} as Challenge)
    })

    it('renders only the screener assignment in editable screener-only mode', () => {
        render(
            <TestHarness
                reviewers={[]}
                screenerOnly
            />,
        )

        expect(screen.getByTestId('human-review-tab')
            .getAttribute('data-screener-only'))
            .toBe('true')
        expect(screen.queryByRole('tablist'))
            .toBeNull()
        expect(screen.queryByTestId('ai-review-tab'))
            .toBeNull()
        expect(screen.queryByTestId('review-context-tab'))
            .toBeNull()
        expect(screen.queryByTestId('review-summary'))
            .toBeNull()
        expect(screen.queryByText('Manual review configuration is required.'))
            .toBeNull()
        expect(screen.queryByRole('button', { name: 'Show advanced review configuration' }))
            .toBeNull()
    })

    it('starts collapsed for administrators and reveals the full configuration on demand', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                canConfigureFullReview
                reviewers={[]}
                screenerOnly
            />,
        )

        expect(screen.getByTestId('human-review-tab')
            .getAttribute('data-screener-only'))
            .toBe('true')
        expect(screen.queryByRole('tablist'))
            .toBeNull()

        await user.click(screen.getByRole('button', { name: 'Show advanced review configuration' }))

        expect(screen.getByRole('tablist')).not.toBeNull()
        expect(screen.getByTestId('human-review-tab')
            .getAttribute('data-screener-only'))
            .toBe('false')
        expect(screen.getByTestId('ai-review-tab')).not.toBeNull()

        await user.click(screen.getByRole('button', { name: 'Hide advanced review configuration' }))

        expect(screen.queryByRole('tablist'))
            .toBeNull()
        expect(screen.getByTestId('human-review-tab')
            .getAttribute('data-screener-only'))
            .toBe('true')
    })

    it('does not offer the advanced toggle outside the simplified review section', () => {
        render(
            <TestHarness
                canConfigureFullReview
                reviewers={[]}
            />,
        )

        expect(screen.queryByRole('button', { name: 'Show advanced review configuration' }))
            .toBeNull()
        expect(screen.getByRole('tablist')).not.toBeNull()
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

        expect(screen.getByTestId('reviewers-form-error').textContent)
            .toBe('Manual review configuration is required.')
    })

    it('requires manual reviewer configuration again as soon as AI gating is reselected', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                reviewers={[]}
            />,
        )

        await user.click(screen.getByRole('tab', { name: 'AI Review (0)' }))
        await user.click(screen.getByRole('button', { name: 'Persist AI only config' }))

        expect(screen.queryByTestId('reviewers-form-error'))
            .toBeNull()

        // The AI gating selection is not persisted yet, but the requirement must already apply.
        await user.click(screen.getByRole('button', { name: 'Select AI gating mode' }))

        expect(screen.getByTestId('reviewers-form-error').textContent)
            .toBe('Manual review configuration is required.')
    })

    it('drops the manual reviewer requirement as soon as AI only is selected', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                reviewers={[]}
            />,
        )

        await user.click(screen.getByRole('tab', { name: 'AI Review (0)' }))
        await user.click(screen.getByRole('button', { name: 'Persist AI config' }))

        expect(screen.getByTestId('reviewers-form-error').textContent)
            .toBe('Manual review configuration is required.')

        await user.click(screen.getByRole('button', { name: 'Select AI only mode' }))

        expect(screen.queryByTestId('reviewers-form-error'))
            .toBeNull()
    })

    it('restores the default timeline when AI gating replaces AI only on a draft', async () => {
        const user = userEvent.setup()
        mockedPatchChallenge.mockResolvedValue(DEFAULT_TIMELINE_CHALLENGE)

        render(
            <TestHarness
                phases={AI_ONLY_TIMELINE_PHASES}
                reviewers={[]}
                status='DRAFT'
            />,
        )

        await user.click(screen.getByRole('tab', { name: 'AI Review (0)' }))
        await user.click(screen.getByRole('button', { name: 'Persist AI config' }))

        expect(mockedPatchChallenge)
            .toHaveBeenCalledWith('challenge-1', {
                reviewers: [],
            })
        await waitFor(() => {
            expect(screen.getByTestId('form-phases').textContent)
                .toBe('Registration,Submission,Review,Approval')
        })
        expect(screen.getByTestId('form-timeline-template').textContent)
            .toBe('default-timeline-template')
        expect(screen.getByTestId('reviewers-form-error').textContent)
            .toBe('Manual review configuration is required.')
    })

    it('keeps the AI only timeline while AI only stays selected', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                phases={AI_ONLY_TIMELINE_PHASES}
                reviewers={[]}
                status='DRAFT'
            />,
        )

        await user.click(screen.getByRole('tab', { name: 'AI Review (0)' }))
        await user.click(screen.getByRole('button', { name: 'Persist AI only config' }))

        expect(mockedPatchChallenge)
            .not.toHaveBeenCalled()
        expect(screen.getByTestId('form-phases').textContent)
            .toBe('Registration,Submission,AI Review,Approval')
    })

    it('does not change the timeline of an active AI only challenge', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                phases={AI_ONLY_TIMELINE_PHASES}
                reviewers={[]}
                status='ACTIVE'
            />,
        )

        await user.click(screen.getByRole('tab', { name: 'AI Review (0)' }))
        await user.click(screen.getByRole('button', { name: 'Persist AI config' }))

        expect(mockedPatchChallenge)
            .not.toHaveBeenCalled()
        expect(screen.getByTestId('form-phases').textContent)
            .toBe('Registration,Submission,AI Review,Approval')
    })

    it('restores the default timeline when the AI config is removed from an AI only draft', async () => {
        const user = userEvent.setup()
        mockedPatchChallenge.mockResolvedValue(DEFAULT_TIMELINE_CHALLENGE)

        render(
            <TestHarness
                phases={AI_ONLY_TIMELINE_PHASES}
                reviewers={[
                    {
                        aiWorkflowId: 'workflow-1',
                        isMemberReview: false,
                        phaseId: 'phase-ai-review',
                        scorecardId: 'scorecard-1',
                    },
                ]}
                status='DRAFT'
            />,
        )

        await user.click(screen.getByRole('tab', { name: 'AI Review (1)' }))
        await user.click(screen.getByRole('button', { name: 'Remove AI config' }))

        expect(mockedPatchChallenge)
            .toHaveBeenCalledWith('challenge-1', {
                reviewers: [],
            })
        await waitFor(() => {
            expect(screen.getByTestId('form-phases').textContent)
                .toBe('Registration,Submission,Review,Approval')
        })
        expect(screen.getByTestId('form-timeline-template').textContent)
            .toBe('default-timeline-template')
    })

    it('does not require manual reviewer configuration in the simplified screener view', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                canConfigureFullReview
                reviewers={[]}
                screenerOnly
            />,
        )

        await user.click(screen.getByRole('button', { name: 'Show advanced review configuration' }))
        await user.click(screen.getByRole('tab', { name: 'AI Review (0)' }))
        await user.click(screen.getByRole('button', { name: 'Persist AI config' }))
        await user.click(screen.getByRole('button', { name: 'Hide advanced review configuration' }))

        expect(screen.queryByTestId('reviewers-form-error'))
            .toBeNull()
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
