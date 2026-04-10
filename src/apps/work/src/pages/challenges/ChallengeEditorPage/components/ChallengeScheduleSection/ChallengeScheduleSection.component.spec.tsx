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
const mockPhaseEditorRow = jest.fn()

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
    canChangeDuration: (
        phase?: {
            actualEndDate?: string
            isOpen?: boolean
        },
    ): boolean => {
        if (!phase) {
            return false
        }

        if (phase.isOpen) {
            return true
        }

        return !phase.actualEndDate
    },
    getMetadataValue: (
        metadata: Array<{
            name?: string
            value?: unknown
        }> | undefined,
        name: string,
    ): string | undefined => {
        const metadataEntry = Array.isArray(metadata)
            ? metadata.find(entry => entry?.name === name)
            : undefined

        return metadataEntry?.value === undefined
            ? undefined
            : String(metadataEntry.value)
    },
    getPhaseDuration: () => 0,
    setMetadataValue: (
        metadata: Array<{
            name?: string
            value?: unknown
        }> | undefined,
        name: string,
        value: string,
    ): Array<{
        name: string
        value: string
    }> => {
        const metadataEntries = Array.isArray(metadata)
            ? metadata.map(entry => ({
                name: entry?.name || '',
                value: String(entry?.value ?? ''),
            }))
            : []
        const existingEntryIndex = metadataEntries.findIndex(entry => entry?.name === name)

        if (existingEntryIndex < 0) {
            return [
                ...metadataEntries,
                {
                    name,
                    value,
                },
            ]
        }

        return metadataEntries.map((entry, index) => (
            index === existingEntryIndex
                ? {
                    ...entry,
                    name,
                    value,
                }
                : {
                    name: entry?.name || '',
                    value: String(entry?.value ?? ''),
                }
        ))
    },
}))

jest.mock('../PhaseEditorRow', () => ({
    PhaseEditorRow: (props: unknown) => {
        mockPhaseEditorRow(props)

        return <div data-testid='phase-editor-row' />
    },
}))

jest.mock('../TimelineVisualization', () => ({
    TimelineVisualization: () => <div data-testid='timeline-visualization' />,
}))

interface TestHarnessProps {
    disabled?: boolean
    metadata?: ChallengeEditorFormData['metadata']
    phases?: ChallengeEditorFormData['phases']
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

const StartDateModeValue = (): JSX.Element => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const metadata = useWatch({
        control: formContext.control,
        name: 'metadata',
    }) as ChallengeEditorFormData['metadata']
    const startDateMode = Array.isArray(metadata)
        ? metadata.find(entry => entry?.name === 'challengeStartMode')?.value
        : undefined

    return (
        <div data-testid='start-date-mode-value'>
            {typeof startDateMode === 'string'
                ? startDateMode
                : ''}
        </div>
    )
}

const TestHarness = (props: TestHarnessProps): JSX.Element => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            legacy: {
                useSchedulingAPI: true,
            },
            metadata: props.metadata,
            phases: props.phases || [],
            reviewers: [],
            startDate: props.startDate,
            trackId: '',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <ChallengeScheduleSection disabled={props.disabled} />
            <StartDateValue />
            <StartDateModeValue />
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

        const startModeGroup = screen.getByRole('radiogroup', {
            name: 'Challenge start mode',
        })
        const startDateLabel = screen.getByText('Start Date')

        expect(startDateLabel)
            .toBeInTheDocument()
        expect(screen.getByText(/Timezone:/))
            .toBeInTheDocument()
        expect(screen.getByRole('radio', { name: 'Scheduled' }))
            .toBeChecked()
        expect(screen.getByRole('radio', { name: 'Immediately' }))
            .not
            .toBeChecked()
        expect(startModeGroup.parentElement)
            .toBe(startDateLabel.parentElement)
        expect(startDateLabel.compareDocumentPosition(startModeGroup))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
        expect(
            startModeGroup.compareDocumentPosition(screen.getByTestId('start-date-input')),
        )
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
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
        expect(screen.getByTestId('start-date-mode-value'))
            .toHaveTextContent('immediately')
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
        expect(screen.getByTestId('start-date-mode-value'))
            .toHaveTextContent('scheduled')
        expect(screen.getByRole('radio', { name: 'Scheduled' }))
            .toBeChecked()
    })

    it('restores immediate mode from saved metadata even when a start date exists', () => {
        render(
            <TestHarness
                metadata={[{
                    name: 'challengeStartMode',
                    value: 'immediately',
                }]}
                startDate='2026-03-28T13:15:00.000Z'
            />,
        )

        expect(screen.getByRole('radio', { name: 'Immediately' }))
            .toBeChecked()
        expect(screen.getByRole('radio', { name: 'Scheduled' }))
            .not
            .toBeChecked()
        expect(screen.getByTestId('start-date-input'))
            .toBeDisabled()
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

    it('renders a working gantt view toggle for read-only challenge view mode', async () => {
        const user = userEvent.setup({
            advanceTimers: jest.advanceTimersByTime,
        })

        render(
            <TestHarness
                disabled
                phases={[{
                    duration: 1440,
                    id: 'phase-1',
                    name: 'Registration',
                    scheduledEndDate: '2026-04-02T10:30:00.000Z',
                    scheduledStartDate: '2026-04-01T10:30:00.000Z',
                }]}
                startDate='2026-04-01T10:30:00.000Z'
            />,
        )

        expect(screen.getByRole('button', { name: 'Switch to Gantt View' }))
            .toBeInTheDocument()
        expect(screen.queryByTestId('timeline-visualization'))
            .not
            .toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Switch to Gantt View' }))

        expect(screen.getByRole('button', { name: 'Switch to Editor View' }))
            .toBeInTheDocument()
        expect(screen.getByTestId('timeline-visualization'))
            .toBeInTheDocument()
    })

    it('returns to the editor rows when the schedule switches from view mode to edit mode', async () => {
        const user = userEvent.setup({
            advanceTimers: jest.advanceTimersByTime,
        })
        const testHarnessProps: TestHarnessProps = {
            disabled: true,
            phases: [{
                duration: 1440,
                id: 'phase-1',
                name: 'Registration',
                scheduledEndDate: '2026-04-02T10:30:00.000Z',
                scheduledStartDate: '2026-04-01T10:30:00.000Z',
            }],
            startDate: '2026-04-01T10:30:00.000Z',
        }
        const renderResult: ReturnType<typeof render> = render(
            <TestHarness {...testHarnessProps} />,
        )

        await user.click(screen.getByRole('button', { name: 'Switch to Gantt View' }))

        expect(screen.getByTestId('timeline-visualization'))
            .toBeInTheDocument()

        renderResult.rerender(
            <TestHarness
                {...testHarnessProps}
                disabled={false}
            />,
        )

        expect(screen.queryByRole('button', { name: 'Switch to Gantt View' }))
            .not
            .toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Switch to Editor View' }))
            .not
            .toBeInTheDocument()
        expect(screen.queryByTestId('timeline-visualization'))
            .not
            .toBeInTheDocument()
        expect(screen.getByTestId('phase-editor-row'))
            .toBeInTheDocument()
    })

    it('locks completed phase end dates and durations using the legacy work-manager rule', () => {
        render(
            <TestHarness
                phases={[
                    {
                        actualEndDate: '2026-04-09T12:51:00.000Z',
                        duration: 15,
                        id: 'phase-1',
                        isOpen: false,
                        name: 'Registration',
                        phaseId: 'registration-phase',
                        scheduledEndDate: '2026-04-09T12:51:00.000Z',
                        scheduledStartDate: '2026-04-09T12:36:00.000Z',
                    },
                    {
                        duration: 2880,
                        id: 'phase-2',
                        isOpen: true,
                        name: 'Checkpoint Review',
                        phaseId: 'checkpoint-review-phase',
                        scheduledEndDate: '2026-04-11T13:02:00.000Z',
                        scheduledStartDate: '2026-04-09T13:02:00.000Z',
                    },
                ]}
                startDate='2026-04-09T12:36:00.000Z'
            />,
        )

        const renderedPhaseRows = mockPhaseEditorRow.mock.calls
            .map(([props]) => props as {
                isDurationEditable?: boolean
                isEndDateEditable?: boolean
                isStartDateEditable?: boolean
                phase?: {
                    name?: string
                }
            })
        const registrationRow = [...renderedPhaseRows]
            .reverse()
            .find(props => props.phase?.name === 'Registration')
        const checkpointReviewRow = [...renderedPhaseRows]
            .reverse()
            .find(props => props.phase?.name === 'Checkpoint Review')

        expect(registrationRow)
            .toEqual(expect.objectContaining({
                isDurationEditable: false,
                isEndDateEditable: false,
                isStartDateEditable: true,
            }))
        expect(checkpointReviewRow)
            .toEqual(expect.objectContaining({
                isDurationEditable: true,
                isEndDateEditable: true,
            }))
    })
})
