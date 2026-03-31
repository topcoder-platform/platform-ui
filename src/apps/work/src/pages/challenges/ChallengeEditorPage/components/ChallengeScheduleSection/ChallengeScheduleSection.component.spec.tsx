/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    FormProvider,
    useForm,
    useFormContext,
    useWatch,
} from 'react-hook-form'

import { ChallengeEditorFormData } from '../../../../../lib/models'

import { ChallengeScheduleSection } from './ChallengeScheduleSection'

const mockUseFetchChallengePhases = jest.fn()
const mockUseFetchChallengeTracks = jest.fn()

jest.mock('~/libs/ui', () => ({
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

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        ADMIN: {
            DIRECT_URL: 'https://example.com/direct',
            REVIEW_UI_URL: 'https://example.com/review',
        },
        API: {
            V6: 'https://example.com/v6',
        },
        CHALLENGE_API_URL: 'https://example.com/challenges',
        CHALLENGE_API_VERSION: 'v5',
        COMMUNITY_APP_URL: 'https://example.com/community',
        COPILOTS_URL: 'https://example.com/copilots',
        DIRECT_PROJECT_URL: 'https://example.com/direct-project',
        ENGAGEMENTS_URL: 'https://example.com/engagements',
        REVIEW_APP_URL: 'https://example.com/review',
        TC_DOMAIN: 'example.com',
        TC_FINANCE_API: 'https://example.com/finance',
        TOPCODER_URL: 'https://example.com/topcoder',
    },
}), {
    virtual: true,
})

jest.mock('../../../../../lib/components/form', () => ({
    StartDateTimeInput: function StartDateTimeInput(props: {
        disabled?: boolean
        label: string
        onChange: (value: Date | null) => void
    }) {
        function handleClick(): void {
            props.onChange(new Date('2026-04-02T10:30:00.000Z'))
        }

        return (
            <button
                data-testid='start-date-input'
                disabled={props.disabled}
                onClick={handleClick}
                type='button'
            >
                {props.label}
            </button>
        )
    },
}))

jest.mock('../../../../../lib/hooks', () => ({
    useFetchChallengePhases: (...args: unknown[]) => mockUseFetchChallengePhases(...args),
    useFetchChallengeTracks: (...args: unknown[]) => mockUseFetchChallengeTracks(...args),
}))

jest.mock('../../../../../lib/utils', () => ({
    getPhaseDuration: () => 0,
}))

jest.mock('../PhaseEditorRow', () => ({
    PhaseEditorRow: () => <div data-testid='phase-editor-row' />,
}))

jest.mock('../TimelineVisualization', () => ({
    TimelineVisualization: () => <div data-testid='timeline-visualization' />,
}))

interface TestHarnessProps {
    startDate?: ChallengeEditorFormData['startDate']
}

const StartDateValue = (): JSX.Element => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const startDate = useWatch({
        control: formContext.control,
        name: 'startDate',
    }) as ChallengeEditorFormData['startDate']

    return (
        <div data-testid='start-date-value'>
            {startDate instanceof Date
                ? startDate.toISOString()
                : startDate || ''}
        </div>
    )
}

const TestHarness = (props: TestHarnessProps): JSX.Element => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            legacy: {
                useSchedulingAPI: true,
            },
            phases: [],
            reviewers: [],
            startDate: props.startDate,
            trackId: '',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <ChallengeScheduleSection />
            <StartDateValue />
        </FormProvider>
    )
}

describe('ChallengeScheduleSection component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-03-31T12:34:00.000Z'))

        mockUseFetchChallengePhases.mockReturnValue({
            challengePhases: [],
            isError: false,
        })
        mockUseFetchChallengeTracks.mockReturnValue({
            tracks: [],
        })
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('renders scheduled start controls with the start date label and timezone', () => {
        render(
            <TestHarness startDate='2026-03-28T13:15:00.000Z' />,
        )

        expect(screen.getByText('Start Date'))
            .toBeInTheDocument()
        expect(screen.getByText(/Timezone:/))
            .toBeInTheDocument()
        expect(screen.getByRole('radio', { name: 'Scheduled' }))
            .toBeChecked()
        expect(screen.getByRole('radio', { name: 'Immediately' }))
            .not
            .toBeChecked()
        expect(screen.getByTestId('start-date-input'))
            .not
            .toBeDisabled()
    })

    it('sets the start date to the current time when immediately is selected', async () => {
        const user = userEvent.setup({
            advanceTimers: jest.advanceTimersByTime,
        })

        render(
            <TestHarness startDate='2026-03-28T13:15:00.000Z' />,
        )

        await user.click(screen.getByRole('radio', { name: 'Immediately' }))

        await waitFor(() => {
            expect(screen.getByTestId('start-date-value'))
                .toHaveTextContent('2026-03-31T12:34:00.000Z')
        })
        expect(screen.getByTestId('start-date-input'))
            .toBeDisabled()
    })

    it('returns to scheduled mode when a manual start date is selected', async () => {
        const user = userEvent.setup({
            advanceTimers: jest.advanceTimersByTime,
        })

        render(<TestHarness />)

        expect(screen.getByRole('radio', { name: 'Immediately' }))
            .toBeChecked()
        expect(screen.getByTestId('start-date-input'))
            .toBeDisabled()

        await user.click(screen.getByRole('radio', { name: 'Scheduled' }))

        expect(screen.getByTestId('start-date-input'))
            .not
            .toBeDisabled()

        await user.click(screen.getByTestId('start-date-input'))

        await waitFor(() => {
            expect(screen.getByTestId('start-date-value'))
                .toHaveTextContent('2026-04-02T10:30:00.000Z')
        })
        expect(screen.getByRole('radio', { name: 'Scheduled' }))
            .toBeChecked()
    })

    it('does not render the gantt view toggle in the editor', () => {
        render(<TestHarness />)

        expect(screen.queryByRole('button', { name: 'Switch to Gantt View' }))
            .not
            .toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Switch to Editor View' }))
            .not
            .toBeInTheDocument()
    })
})
