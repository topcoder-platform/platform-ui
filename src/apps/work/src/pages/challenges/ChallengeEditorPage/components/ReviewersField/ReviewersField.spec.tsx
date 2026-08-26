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
        },
    ) {
        function handleRemoveClick(): void {
            props.onConfigRemoved?.()
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
    reviewers: Reviewer[]
    screenerOnly?: boolean
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
