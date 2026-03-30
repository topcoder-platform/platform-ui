/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
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

    it('shows only AI_GATING as a visible review mode option for standard configs', async () => {
        render(
            <AiReviewTab
                challengeId='challenge-1'
                reviewers={[]}
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

    it('keeps legacy AI_ONLY configs visible without exposing AI_ONLY in the dropdown list', async () => {
        mockedFetchAiReviewConfigByChallenge.mockResolvedValueOnce({
            ...baseConfiguration,
            autoFinalize: true,
            mode: 'AI_ONLY',
        })

        render(
            <AiReviewTab
                challengeId='challenge-1'
                reviewers={[]}
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
