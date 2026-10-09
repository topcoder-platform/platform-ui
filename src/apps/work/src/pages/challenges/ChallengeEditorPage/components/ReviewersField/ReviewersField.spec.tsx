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
            canSwitchReviewMode?: boolean
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
                {props.canSwitchReviewMode === false
                    ? <div data-testid='ai-review-mode-locked'>AI review mode locked</div>
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
    timelineTemplateId?: string
}

const STARTED_PHASE = {
    actualStartDate: '2026-10-01T00:00:00.000Z',
    isOpen: true,
}
const ACTIVE_AI_ONLY_PHASES: ChallengeEditorFormData['phases'] = [
    {
        ...STARTED_PHASE,
        id: 'challenge-phase-registration',
        name: 'Registration',
        phaseId: 'phase-registration',
    },
    {
        ...STARTED_PHASE,
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
const ACTIVE_AI_GATING_PHASES: ChallengeEditorFormData['phases'] = [
    ACTIVE_AI_ONLY_PHASES[0],
    ACTIVE_AI_ONLY_PHASES[1],
    {
        id: 'challenge-phase-ai-screening',
        name: 'AI Screening',
        phaseId: 'phase-ai-screening',
    },
    {
        id: 'challenge-phase-review',
        name: 'Review',
        phaseId: 'phase-review',
    },
    {
        id: 'challenge-phase-appeals',
        name: 'Appeals',
        phaseId: 'phase-appeals',
    },
]
const AI_GATING_TIMELINE_CHALLENGE = {
    phases: ACTIVE_AI_GATING_PHASES,
    timelineTemplateId: 'default-timeline-template',
} as Challenge
const AI_ONLY_TIMELINE_CHALLENGE = {
    phases: ACTIVE_AI_ONLY_PHASES,
    timelineTemplateId: 'ai-only-timeline-template',
} as Challenge

const TestHarness = (props: TestHarnessProps): JSX.Element => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            id: 'challenge-1',
            numOfSubmissions: props.numOfSubmissions,
            phases: props.phases || [],
            reviewers: props.reviewers,
            status: props.status,
            timelineTemplateId: props.timelineTemplateId,
            trackId: 'track-id',
            typeId: 'type-id',
        },
    })
    const formPhaseNames = (formMethods.watch('phases') || [])
        .map(phase => phase.name)
        .join(',')
    const formTimelineTemplateId = formMethods.watch('timelineTemplateId')
    const reviewersField = (
        <ReviewersField
            canConfigureFullReview={props.canConfigureFullReview}
            isReadOnly={props.isReadOnly}
            screenerOnly={props.screenerOnly}
        />
    )

    const reviewersFormError = formMethods.formState.errors.reviewers?.message

    return (
        <FormProvider {...formMethods}>
            {reviewersField}
            <div data-testid='form-phases'>{formPhaseNames}</div>
            <div data-testid='form-timeline-template'>{formTimelineTemplateId}</div>
            {reviewersFormError
                ? <div data-testid='reviewers-form-error'>{reviewersFormError}</div>
                : undefined}
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

    it('moves an active AI only challenge to the AI gating timeline before review starts', async () => {
        const user = userEvent.setup()
        mockedPatchChallenge.mockResolvedValue(AI_GATING_TIMELINE_CHALLENGE)

        render(
            <TestHarness
                numOfSubmissions={2}
                phases={ACTIVE_AI_ONLY_PHASES}
                reviewers={[]}
                status='ACTIVE'
                timelineTemplateId='ai-only-timeline-template'
            />,
        )

        await user.click(screen.getByRole('tab', { name: 'AI Review (0)' }))
        expect(screen.queryByTestId('ai-review-mode-locked'))
            .toBeNull()
        await user.click(screen.getByRole('button', { name: 'Persist AI config' }))

        expect(mockedPatchChallenge)
            .toHaveBeenCalledWith('challenge-1', {
                reviewers: [],
            })
        await waitFor(() => {
            expect(screen.getByTestId('form-phases').textContent)
                .toBe('Registration,Submission,AI Screening,Review,Appeals')
        })
        expect(screen.getByTestId('form-timeline-template').textContent)
            .toBe('default-timeline-template')
    })

    it('moves an active AI gating challenge to the AI only timeline before review starts', async () => {
        const user = userEvent.setup()
        mockedPatchChallenge.mockResolvedValue(AI_ONLY_TIMELINE_CHALLENGE)

        render(
            <TestHarness
                numOfSubmissions={2}
                phases={ACTIVE_AI_GATING_PHASES}
                reviewers={[
                    {
                        isMemberReview: true,
                        phaseId: 'phase-review',
                        scorecardId: 'scorecard-1',
                    },
                ]}
                status='ACTIVE'
                timelineTemplateId='default-timeline-template'
            />,
        )

        await user.click(screen.getByRole('tab', { name: 'AI Review (0)' }))
        await user.click(screen.getByRole('button', { name: 'Persist AI only config' }))

        expect(mockedPatchChallenge)
            .toHaveBeenCalledWith('challenge-1', {
                reviewers: [],
            })
        await waitFor(() => {
            expect(screen.getByTestId('form-phases').textContent)
                .toBe('Registration,Submission,AI Review,Approval')
        })
        expect(screen.getByTestId('form-timeline-template').textContent)
            .toBe('ai-only-timeline-template')
    })

    it('does not patch an active challenge whose timeline already matches the review mode', async () => {
        const user = userEvent.setup()

        render(
            <TestHarness
                phases={ACTIVE_AI_ONLY_PHASES}
                reviewers={[]}
                status='ACTIVE'
            />,
        )

        await user.click(screen.getByRole('tab', { name: 'AI Review (0)' }))
        await user.click(screen.getByRole('button', { name: 'Persist AI only config' }))

        expect(mockedPatchChallenge)
            .not.toHaveBeenCalled()
    })

    it('locks the review mode and keeps the timeline once the review phase has started', async () => {
        const user = userEvent.setup()
        const reviewStartedPhases = ACTIVE_AI_ONLY_PHASES.map(phase => (
            phase.name === 'AI Review'
                ? { ...phase, ...STARTED_PHASE }
                : phase
        ))

        render(
            <TestHarness
                numOfSubmissions={2}
                phases={reviewStartedPhases}
                reviewers={[]}
                status='ACTIVE'
            />,
        )

        await user.click(screen.getByRole('tab', { name: 'AI Review (0)' }))
        expect(screen.getByTestId('ai-review-mode-locked')).not.toBeNull()
        await user.click(screen.getByRole('button', { name: 'Persist AI config' }))

        expect(mockedPatchChallenge)
            .not.toHaveBeenCalled()
        expect(screen.getByTestId('form-phases').textContent)
            .toBe('Registration,Submission,AI Review,Approval')
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
