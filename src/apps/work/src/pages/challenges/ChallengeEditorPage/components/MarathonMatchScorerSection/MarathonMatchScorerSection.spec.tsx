/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
import '@testing-library/jest-dom'
import {
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
    ChallengePhase,
    CreateMarathonMatchConfigInput,
    MarathonMatchConfig,
    MarathonMatchDefaults,
    MarathonMatchTester,
    MarathonMatchTesterSummary,
} from '../../../../../lib/models'
import {
    createMarathonMatchConfig,
    fetchMarathonMatchConfig,
    fetchMarathonMatchDefaults,
    fetchTester,
    fetchTesters,
} from '../../../../../lib/services'

import { MarathonMatchScorerSection } from './MarathonMatchScorerSection'

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: {
        buttons?: JSX.Element
        children?: JSX.Element
        open?: boolean
        title?: string
    }) => (props.open
        ? (
            <div aria-modal='true' role='dialog'>
                {props.title ? <h4>{props.title}</h4> : undefined}
                {props.children}
                {props.buttons}
            </div>
        )
        : null),
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
        type?: 'button' | 'submit'
    }) => (
        <button
            disabled={props.disabled}
            onClick={props.onClick}
            type={props.type === 'submit'
                ? 'submit'
                : 'button'}
        >
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})

jest.mock('../../../../../lib/services', () => ({
    createMarathonMatchConfig: jest.fn(),
    fetchMarathonMatchConfig: jest.fn(),
    fetchMarathonMatchDefaults: jest.fn(),
    fetchMarathonMatchTestSubmissionStatus: jest.fn(),
    fetchTester: jest.fn(),
    fetchTesters: jest.fn(),
    rerunMarathonMatchScores: jest.fn(),
    updateMarathonMatchConfig: jest.fn(),
    uploadMarathonMatchTestSubmission: jest.fn(),
}))

jest.mock('../../../../../lib/utils', () => ({
    formatDateTime: (value: unknown): string => String(value || ''),
    showErrorToast: jest.fn(),
    showInfoToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))

jest.mock('./TesterModal', () => ({
    TesterModal: () => null,
}))

const CHALLENGE_ID = 'challenge-1'

const phases: ChallengePhase[] = [
    {
        id: 'phase-example',
        name: 'Submission',
        phaseId: 'phase-example',
    },
    {
        id: 'phase-review',
        name: 'Review',
        phaseId: 'phase-review',
    },
]

const defaults: MarathonMatchDefaults = {
    compileTimeout: 300000,
    reviewScorecardId: 'scorecard-1',
    taskDefinitionName: 'runner-task',
    taskDefinitionVersion: '1',
    testTimeout: 600000,
}

const testerSummary: MarathonMatchTesterSummary = {
    className: 'ExampleScorer',
    compilationError: null,
    compilationStatus: 'SUCCESS',
    createdAt: '2026-06-24T00:00:00.000Z',
    id: 'tester-1',
    name: 'Example Scorer',
    updatedAt: '2026-06-24T00:00:00.000Z',
    version: '1.0.0',
}

const tester: MarathonMatchTester = {
    ...testerSummary,
    sourceCode: 'public class ExampleScorer {}',
}

const mockCreateMarathonMatchConfig = createMarathonMatchConfig as jest.MockedFunction<
    typeof createMarathonMatchConfig
>
const mockFetchMarathonMatchConfig = fetchMarathonMatchConfig as jest.MockedFunction<
    typeof fetchMarathonMatchConfig
>
const mockFetchMarathonMatchDefaults = fetchMarathonMatchDefaults as jest.MockedFunction<
    typeof fetchMarathonMatchDefaults
>
const mockFetchTester = fetchTester as jest.MockedFunction<typeof fetchTester>
const mockFetchTesters = fetchTesters as jest.MockedFunction<typeof fetchTesters>

function buildSavedConfig(
    challengeId: string,
    input: CreateMarathonMatchConfigInput,
): MarathonMatchConfig {
    return {
        active: input.active !== false,
        challengeId,
        compileTimeout: input.compileTimeout,
        createdAt: '2026-06-24T00:00:00.000Z',
        example: input.example || null,
        id: 'config-1',
        name: input.name,
        provisional: input.provisional || null,
        relativeScoringEnabled: input.relativeScoringEnabled !== false,
        reviewScorecardId: input.reviewScorecardId,
        scoreDirection: input.scoreDirection || 'MAXIMIZE',
        system: input.system || null,
        taskDefinitionName: input.taskDefinitionName,
        taskDefinitionVersion: input.taskDefinitionVersion,
        testerId: input.testerId,
        testTimeout: input.testTimeout,
        updatedAt: '2026-06-24T00:00:00.000Z',
    }
}

describe('MarathonMatchScorerSection', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockFetchMarathonMatchDefaults.mockResolvedValue(defaults)
        mockFetchMarathonMatchConfig.mockResolvedValue(undefined)
        mockFetchTesters.mockResolvedValue([testerSummary])
        mockFetchTester.mockResolvedValue(tester)
        mockCreateMarathonMatchConfig.mockImplementation(
            async (challengeId, input) => buildSavedConfig(challengeId, input),
        )
    })

    it('defaults to Maximize and saves the selected Minimize score direction', async () => {
        const user = userEvent.setup()

        render(
            <MarathonMatchScorerSection
                challengeId={CHALLENGE_ID}
                onScorerConfigChange={jest.fn()}
                phases={phases}
            />,
        )

        const scoreDirectionGroup = await screen.findByRole('group', {
            name: 'Score Direction',
        })
        const maximizeOption = within(scoreDirectionGroup)
            .getByRole('radio', { name: 'Maximize' })
        const minimizeOption = within(scoreDirectionGroup)
            .getByRole('radio', { name: 'Minimize' })

        expect(maximizeOption)
            .toBeChecked()
        expect(minimizeOption)
            .not
            .toBeChecked()

        await user.selectOptions(
            screen.getByRole('combobox', { name: /Scorer/ }),
            testerSummary.id,
        )
        await user.click(minimizeOption)

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Save Scorer Config' }))
                .toBeEnabled()
        })

        await user.click(screen.getByRole('button', { name: 'Save Scorer Config' }))

        await waitFor(() => {
            expect(mockCreateMarathonMatchConfig)
                .toHaveBeenCalledWith(
                    CHALLENGE_ID,
                    expect.objectContaining({
                        scoreDirection: 'MINIMIZE',
                        testerId: testerSummary.id,
                    }),
                )
        })
    })
})
