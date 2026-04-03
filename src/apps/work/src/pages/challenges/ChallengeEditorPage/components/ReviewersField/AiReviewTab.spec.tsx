/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import {
    useFetchChallengeTracks,
    useFetchChallengeTypes,
} from '../../../../../lib/hooks'
import {
    fetchAiReviewConfigByChallenge,
    fetchWorkflows,
} from '../../../../../lib/services'

import AiReviewTab from './AiReviewTab'

jest.mock('../../../../../lib/components', () => ({
    ConfirmationModal: () => <></>,
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
}), {
    virtual: true,
})

const mockedUseFetchChallengeTracks = useFetchChallengeTracks as jest.Mock
const mockedUseFetchChallengeTypes = useFetchChallengeTypes as jest.Mock
const mockedFetchAiReviewConfigByChallenge = fetchAiReviewConfigByChallenge as jest.Mock
const mockedFetchWorkflows = fetchWorkflows as jest.Mock

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
        mockedFetchAiReviewConfigByChallenge.mockResolvedValue(baseConfiguration)
        mockedFetchWorkflows.mockResolvedValue([])
    })

    it('does not fetch a persisted AI review config before any AI reviewers are synced', async () => {
        render(
            <AiReviewTab
                challengeId='challenge-1'
                reviewers={[]}
            />,
        )

        expect(await screen.findByRole('button', { name: 'Choose template' })).not.toBeNull()
        expect(mockedFetchAiReviewConfigByChallenge)
            .not.toHaveBeenCalled()
    })

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
})
