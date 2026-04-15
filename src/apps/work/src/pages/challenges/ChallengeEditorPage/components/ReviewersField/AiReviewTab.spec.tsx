/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    useCallback,
    useState,
} from 'react'
import userEvent from '@testing-library/user-event'
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import {
    useFetchChallengeTracks,
    useFetchChallengeTypes,
} from '../../../../../lib/hooks'
import { AiReviewConfig } from '../../../../../lib/models'
import {
    createAiReviewConfig,
    deleteAiReviewConfig,
    fetchAiReviewConfigByChallenge,
    fetchAiReviewTemplates,
    fetchWorkflows,
    updateAiReviewConfig,
} from '../../../../../lib/services'

import AiReviewTab from './AiReviewTab'

jest.mock('../../../../../lib/components', () => ({
    ConfirmationModal: (props: {
        cancelText: string
        confirmText: string
        onCancel: () => void
        onConfirm: () => void
        title: string
    }) => (
        <div>
            <div>{props.title}</div>
            <button onClick={props.onCancel} type='button'>
                {props.cancelText}
            </button>
            <button onClick={props.onConfirm} type='button'>
                {props.confirmText}
            </button>
        </div>
    ),
}))
jest.mock('../../../../../lib/hooks', () => ({
    useFetchChallengeTracks: jest.fn(),
    useFetchChallengeTypes: jest.fn(),
}))
jest.mock('../../../../../lib/services', () => ({
    createAiReviewConfig: jest.fn(),
    deleteAiReviewConfig: jest.fn(),
    fetchAiReviewConfigByChallenge: jest.fn(),
    fetchAiReviewTemplates: jest.fn(),
    fetchWorkflows: jest.fn(),
    updateAiReviewConfig: jest.fn(),
}))
jest.mock('../../../../../lib/utils', () => ({
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
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
    IconOutline: {
        LightningBoltIcon: (props: {
            className?: string
        }) => (
            <svg
                className={props.className}
                data-testid='lightning-bolt-icon'
            />
        ),
    },
}), {
    virtual: true,
})

const mockedUseFetchChallengeTracks = useFetchChallengeTracks as jest.Mock
const mockedUseFetchChallengeTypes = useFetchChallengeTypes as jest.Mock
const mockedCreateAiReviewConfig = createAiReviewConfig as jest.Mock
const mockedDeleteAiReviewConfig = deleteAiReviewConfig as jest.Mock
const mockedFetchAiReviewTemplates = fetchAiReviewTemplates as jest.Mock
const mockedFetchAiReviewConfigByChallenge = fetchAiReviewConfigByChallenge as jest.Mock
const mockedFetchWorkflows = fetchWorkflows as jest.Mock
const mockedUpdateAiReviewConfig = updateAiReviewConfig as jest.Mock

const persistedAiReviewers = [
    {
        aiWorkflowId: 'workflow-1',
        isMemberReview: false,
    },
]
const baseConfiguration = {
    autoFinalize: false,
    challengeId: 'challenge-1',
    id: 'config-1',
    minPassingThreshold: 75,
    mode: 'AI_GATING',
    workflows: [],
}

describe('AiReviewTab review mode options', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedUseFetchChallengeTracks.mockReturnValue({
            tracks: [],
        })
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [],
        })
        mockedDeleteAiReviewConfig.mockResolvedValue(undefined)
        mockedFetchAiReviewConfigByChallenge.mockResolvedValue(baseConfiguration)
        mockedFetchWorkflows.mockResolvedValue([])
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('does not fetch a persisted AI review config before the challenge has been saved', async () => {
        render(
            <AiReviewTab
                reviewers={[]}
            />,
        )

        expect(await screen.findByRole('button', { name: 'Choose template' })).not.toBeNull()
        expect(mockedFetchAiReviewConfigByChallenge)
            .not.toHaveBeenCalled()
    })

    it(
        'loads a persisted AI review config for existing challenges when synced AI reviewers are missing',
        async () => {
            const onConfigPersisted = jest.fn()

            render(
                <AiReviewTab
                    challengeId='challenge-1'
                    onConfigPersisted={onConfigPersisted}
                    reviewers={[]}
                />,
            )

            expect(await screen.findByRole('combobox')).not.toBeNull()
            await waitFor(() => {
                expect(mockedFetchAiReviewConfigByChallenge)
                    .toHaveBeenCalledWith('challenge-1')
            })
            expect(onConfigPersisted)
                .toHaveBeenCalledWith(baseConfiguration)
        },
    )

    it('shows only AI_GATING as a visible review mode option for standard configs', async () => {
        render(
            <AiReviewTab
                challengeId='challenge-1'
                reviewers={persistedAiReviewers}
            />,
        )

        const reviewModeSelect = await screen.findByRole('combobox')

        expect(
            Array.from(reviewModeSelect.querySelectorAll('option'))
                .map(option => option.textContent),
        )
            .toEqual([
                'AI_GATING',
            ])
        expect(screen.getByRole('option', { name: 'AI_GATING' })).not.toBeNull()
        expect(
            screen.queryByRole('option', { name: 'AI_ONLY (legacy)' }),
        )
            .toBeNull()
    })

    it('does not refetch the persisted AI review config when the parent callback changes', async () => {
        const firstOnConfigPersisted = jest.fn()
        const secondOnConfigPersisted = jest.fn()
        const renderResult = render(
            <AiReviewTab
                challengeId='challenge-1'
                onConfigPersisted={firstOnConfigPersisted}
                reviewers={persistedAiReviewers}
            />,
        )

        expect(await screen.findByRole('combobox')).not.toBeNull()
        await waitFor(() => {
            expect(mockedFetchAiReviewConfigByChallenge)
                .toHaveBeenCalledTimes(1)
        })

        renderResult.rerender(
            <AiReviewTab
                challengeId='challenge-1'
                onConfigPersisted={secondOnConfigPersisted}
                reviewers={persistedAiReviewers}
            />,
        )

        await waitFor(() => {
            expect(mockedFetchAiReviewConfigByChallenge)
                .toHaveBeenCalledTimes(1)
        })
        expect(firstOnConfigPersisted)
            .toHaveBeenCalledWith(baseConfiguration)
        expect(secondOnConfigPersisted).not.toHaveBeenCalled()
    })

    it('does not refetch a removed persisted AI review config for the same challenge', async () => {
        const user = userEvent.setup()
        const onConfigRemoved = jest.fn()

        render(
            <AiReviewTab
                challengeId='challenge-1'
                onConfigRemoved={onConfigRemoved}
                reviewers={persistedAiReviewers}
            />,
        )

        expect(await screen.findByRole('combobox')).not.toBeNull()
        await waitFor(() => {
            expect(mockedFetchAiReviewConfigByChallenge)
                .toHaveBeenCalledTimes(1)
        })

        await user.click(screen.getByRole('button', { name: 'Remove AI config' }))

        await waitFor(() => {
            expect(mockedDeleteAiReviewConfig)
                .toHaveBeenCalledWith('config-1')
        })
        await waitFor(() => {
            expect(onConfigRemoved)
                .toHaveBeenCalledTimes(1)
        })
        expect(await screen.findByRole('button', { name: 'Choose template' })).not.toBeNull()
        expect(mockedFetchAiReviewConfigByChallenge)
            .toHaveBeenCalledTimes(1)
        expect(screen.queryByText('Loading AI review configuration...'))
            .toBeNull()
    })

    it('keeps legacy AI_ONLY configs visible without exposing AI_ONLY in the dropdown list', async () => {
        mockedFetchAiReviewConfigByChallenge.mockResolvedValueOnce({
            ...baseConfiguration,
            autoFinalize: true,
            mode: 'AI_ONLY',
        })

        render(
            <AiReviewTab
                challengeId='challenge-1'
                reviewers={persistedAiReviewers}
            />,
        )

        const reviewModeSelect = await screen.findByRole('combobox')
        const visibleOptionLabels = Array.from(reviewModeSelect.querySelectorAll('option'))
            .filter(option => !option.hidden)
            .map(option => option.textContent)
        const legacyOption = reviewModeSelect.querySelector('option[hidden]')

        expect(visibleOptionLabels)
            .toEqual([
                'AI_GATING',
            ])
        expect(legacyOption?.textContent)
            .toBe('AI_ONLY (legacy)')
        expect(screen.getByText(
            'AI_ONLY is a legacy configuration and is no longer available for new setups.',
        )).not.toBeNull()
    })

    it('renders manual workflow headings with a space before the workflow number', async () => {
        mockedFetchAiReviewConfigByChallenge.mockResolvedValueOnce({
            ...baseConfiguration,
            workflows: [
                {
                    id: 'config-workflow-1',
                    isGating: false,
                    weightPercent: 100,
                    workflowId: 'workflow-1',
                },
            ],
        })
        mockedFetchWorkflows.mockResolvedValueOnce([
            {
                id: 'workflow-1',
                name: 'Workflow name',
            },
        ])

        render(
            <AiReviewTab
                challengeId='challenge-1'
                reviewers={persistedAiReviewers}
            />,
        )

        expect(await screen.findByRole('heading', { name: 'Workflow 1' })).not.toBeNull()
        expect(screen.queryByRole('heading', { name: 'Workflow1' }))
            .toBeNull()
    })

    it('shows gating workflow helper text and icon only for checked workflows', async () => {
        mockedFetchAiReviewConfigByChallenge.mockResolvedValueOnce({
            ...baseConfiguration,
            workflows: [
                {
                    id: 'draft-1',
                    isGating: true,
                    weightPercent: 20,
                    workflowId: 'workflow-1',
                },
                {
                    id: 'draft-2',
                    isGating: false,
                    weightPercent: 80,
                    workflowId: 'workflow-2',
                },
            ],
        })
        mockedFetchWorkflows.mockResolvedValueOnce([
            {
                id: 'workflow-1',
                name: 'Workflow 1',
            },
            {
                id: 'workflow-2',
                name: 'Workflow 2',
            },
        ])

        render(
            <AiReviewTab
                challengeId='challenge-1'
                reviewers={persistedAiReviewers}
            />,
        )

        expect(await screen.findAllByText(/Submissions below threshold are locked\./))
            .toHaveLength(2)
        expect(screen.getByText(/Pass\/fail gate\./)).not.toBeNull()
        expect(screen.getAllByTestId('lightning-bolt-icon'))
            .toHaveLength(1)
    })

    it('clears templateId when switching a saved template config to manual mode', async () => {
        jest.useFakeTimers()

        mockedFetchAiReviewTemplates.mockResolvedValueOnce([
            {
                autoFinalize: false,
                description: 'Template description',
                id: 'template-1',
                minPassingThreshold: 75,
                mode: 'AI_GATING',
                title: 'Template 1',
                workflows: [
                    {
                        id: 'config-workflow-1',
                        isGating: false,
                        weightPercent: 100,
                        workflowId: 'workflow-1',
                    },
                ],
            },
        ])
        mockedFetchAiReviewConfigByChallenge.mockResolvedValueOnce({
            ...baseConfiguration,
            templateId: 'template-1',
            workflows: [
                {
                    id: 'config-workflow-1',
                    isGating: false,
                    weightPercent: 100,
                    workflowId: 'workflow-1',
                },
            ],
        })
        mockedFetchWorkflows.mockResolvedValueOnce([
            {
                id: 'workflow-1',
                name: 'Workflow 1',
            },
        ])
        mockedUpdateAiReviewConfig.mockImplementation(async (_configId, input) => ({
            ...baseConfiguration,
            ...input,
            id: 'config-1',
        }))

        render(
            <AiReviewTab
                challengeId='challenge-1'
                reviewers={persistedAiReviewers}
            />,
        )

        fireEvent.click(await screen.findByRole('button', { name: 'Switch to manual' }))
        fireEvent.click(screen.getAllByRole('button', { name: 'Switch to manual' })[1])

        expect(await screen.findByText('Manual configuration')).not.toBeNull()

        await act(async () => {
            jest.advanceTimersByTime(1600)
        })

        await waitFor(() => {
            expect(mockedUpdateAiReviewConfig)
                .toHaveBeenCalledWith(
                    'config-1',
                    expect.objectContaining({
                        challengeId: 'challenge-1',
                        templateId: '',
                    }),
                )
        })
    })

    it('does not refetch and overwrite a locally saved gating selection when AI reviewers sync in', async () => {
        jest.useFakeTimers()

        const user = userEvent.setup({
            advanceTimers: jest.advanceTimersByTime,
        })
        const savedConfiguration = {
            ...baseConfiguration,
            workflows: [
                {
                    id: 'saved-workflow-1',
                    isGating: true,
                    weightPercent: 100,
                    workflowId: 'workflow-1',
                },
            ],
        }

        mockedFetchAiReviewConfigByChallenge.mockResolvedValueOnce(undefined)
        mockedCreateAiReviewConfig.mockResolvedValueOnce(savedConfiguration)
        mockedFetchWorkflows.mockResolvedValueOnce([
            {
                id: 'workflow-1',
                name: 'Workflow 1',
            },
        ])

        const LocalPersistenceHarness = (): JSX.Element => {
            const [reviewers, setReviewers] = useState<typeof persistedAiReviewers>([])
            const handleConfigPersisted = useCallback((config: AiReviewConfig): void => {
                setReviewers(config.workflows.map(workflow => ({
                    aiWorkflowId: workflow.workflowId,
                    isMemberReview: false,
                })))
            }, [])

            return (
                <AiReviewTab
                    challengeId='challenge-1'
                    onConfigPersisted={handleConfigPersisted}
                    reviewers={reviewers}
                />
            )
        }

        render(<LocalPersistenceHarness />)

        await user.click(await screen.findByRole('button', { name: 'Configure manually' }))
        await user.click(screen.getByRole('button', { name: 'Add AI workflow' }))

        fireEvent.change(screen.getByLabelText('AI Workflow'), {
            target: {
                value: 'workflow-1',
            },
        })
        fireEvent.change(screen.getByLabelText('Weight (%)'), {
            target: {
                value: '100',
            },
        })
        fireEvent.click(screen.getByRole('checkbox', { name: 'Use as gating workflow' }))

        expect(
            (screen.getByRole('checkbox', { name: 'Use as gating workflow' }) as HTMLInputElement)
                .checked,
        )
            .toBe(true)

        await act(async () => {
            jest.advanceTimersByTime(1500)
        })

        await waitFor(() => {
            expect(mockedCreateAiReviewConfig)
                .toHaveBeenCalledTimes(1)
        })
        await waitFor(() => {
            expect(mockedFetchAiReviewConfigByChallenge)
                .toHaveBeenCalledTimes(1)
        })
        expect(
            (screen.getByRole('checkbox', { name: 'Use as gating workflow' }) as HTMLInputElement)
                .checked,
        )
            .toBe(true)
    })
})
