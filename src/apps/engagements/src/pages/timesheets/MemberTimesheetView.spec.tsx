/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports,
   unicorn/no-null -- the entry fixture mirrors the API payload, which uses null for absent values */
import '@testing-library/jest-dom'

import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { TimesheetEntry, TimesheetView } from '../../lib/models'
import { TimesheetEntryStatus, TimesheetViewerRole } from '../../lib/models'
import { saveTimesheetEntries, submitTimesheetEntries } from '../../lib/services'

import MemberTimesheetView from './MemberTimesheetView'

jest.mock('react-toastify', () => ({
    toast: { error: jest.fn(), success: jest.fn() },
}))

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: {
        buttons?: React.ReactNode
        children: React.ReactNode
        open: boolean
        title?: string
    }) => (props.open
        ? (
            <div role='dialog'>
                <h2>{props.title}</h2>
                {props.children}
                {props.buttons}
            </div>
        )
        : <></>),
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
    }) => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
    // Stands in for the shared date picker. Only a complete YYYY-MM-DD value reports a change, the way
    // the real picker only fires once a date is actually chosen.
    InputDatePicker: (props: {
        date?: Date
        label: string
        onChange: (date: Date | null) => void
    }) => (
        <label>
            {props.label}
            <input
                onChange={function onPickerChange(
                    event: React.ChangeEvent<HTMLInputElement>,
                ) {
                    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(event.target.value)

                    if (!match) {
                        return
                    }

                    props.onChange(
                        new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
                    )
                }}
                type='text'
                value={props.date
                    ? [
                        props.date.getFullYear(),
                        String(props.date.getMonth() + 1)
                            .padStart(2, '0'),
                        String(props.date.getDate())
                            .padStart(2, '0'),
                    ].join('-')
                    : ''}
            />
        </label>
    ),
}), { virtual: true })

jest.mock('../../lib/services', () => ({
    saveTimesheetEntries: jest.fn(),
    submitTimesheetEntries: jest.fn(),
}))

const mockSave = saveTimesheetEntries as jest.MockedFunction<typeof saveTimesheetEntries>
const mockSubmit = submitTimesheetEntries as jest.MockedFunction<typeof submitTimesheetEntries>

const entry = (overrides: Partial<TimesheetEntry> = {}): TimesheetEntry => ({
    approvalComment: null,
    approvedAt: null,
    approvedByHandle: null,
    hoursWorked: '8.50',
    id: 'entry-1',
    isPaid: false,
    outsideAssignmentWindow: false,
    remarks: 'Sprint planning',
    reopenedAt: null,
    status: TimesheetEntryStatus.DRAFT,
    submittedAt: null,
    workDate: '2026-09-07',
    ...overrides,
})

const timesheet = (entries: TimesheetEntry[] = []): TimesheetView => ({
    assignment: {
        endDate: '2026-09-30',
        id: 'asg-1',
        memberHandle: 'johnsmith',
        memberId: '1001',
        memberName: 'John Smith',
        standardHoursPerDay: 8,
        startDate: '2026-09-01',
        status: 'ASSIGNED',
    },
    engagementId: 'eng-1',
    engagementTitle: 'Senior Frontend Engineer',
    entries,
    managers: [{ handle: 'maryj', name: 'Mary Jones', userId: '2002' }],
    viewerRole: TimesheetViewerRole.MEMBER,
})

const renderView = (entries: TimesheetEntry[] = []): {
    onTimesheetChange: jest.Mock
} & ReturnType<typeof render> => {
    const onTimesheetChange = jest.fn()
    const utils = render(
        <MemberTimesheetView
            onDirtyChange={jest.fn()}
            onTimesheetChange={onTimesheetChange}
            timesheet={timesheet(entries)}
        />,
    )

    return { onTimesheetChange, ...utils }
}

/**
 * Sets the From/To pickers to a range.
 *
 * Uses fireEvent rather than typing, because a real date picker reports a whole date at once - typing
 * would report a partial value on every keystroke.
 */
const pickRange = async (fromDate: string, toDate: string): Promise<void> => {
    fireEvent.change(screen.getByLabelText('From Date'), { target: { value: fromDate } })
    fireEvent.change(screen.getByLabelText('To Date'), { target: { value: toDate } })

    await waitFor(() => {
        expect(screen.getByLabelText('To Date'))
            .toHaveValue(toDate)
    })
}

describe('MemberTimesheetView', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('generates one row per calendar day, inclusive of both ends', async () => {
        renderView()

        await pickRange('2026-09-07', '2026-09-11')

        await waitFor(() => {
            expect(screen.getByText('07-09-2026'))
                .toBeInTheDocument()
        })
        expect(screen.getByText('11-09-2026'))
            .toBeInTheDocument()
        expect(screen.getAllByRole('row')
            // header row, five day rows, totals row
            .length)
            .toBe(7)
    })

    it('blocks a to date earlier than the from date', async () => {
        renderView()

        await pickRange('2026-09-11', '2026-09-07')

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('The to date cannot be earlier than the from date.')
    })

    it('blocks a range longer than 31 days', async () => {
        renderView()

        await pickRange('2026-09-01', '2026-10-05')

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('A timesheet range cannot span more than 31 days.')
    })

    it('merges a saved entry into the generated rows rather than duplicating it', async () => {
        renderView([entry({ hoursWorked: '7.25', remarks: 'Review', workDate: '2026-09-08' })])

        await pickRange('2026-09-07', '2026-09-09')

        await waitFor(() => {
            expect(screen.getByDisplayValue('7.25'))
                .toBeInTheDocument()
        })
        expect(screen.getByDisplayValue('Review'))
            .toBeInTheDocument()
        expect(screen.getAllByText('08-09-2026'))
            .toHaveLength(1)
    })

    it('shows the selection summary with a counted submit button', async () => {
        const user = userEvent.setup()
        renderView([
            entry({ hoursWorked: '8.50', id: 'e1', workDate: '2026-09-07' }),
            entry({ hoursWorked: '8', id: 'e2', workDate: '2026-09-08' }),
        ])

        await pickRange('2026-09-07', '2026-09-08')
        await waitFor(() => {
            expect(screen.getByLabelText('Select 07-09-2026'))
                .toBeInTheDocument()
        })

        await user.click(screen.getByLabelText('Select 07-09-2026'))
        await user.click(screen.getByLabelText('Select 08-09-2026'))

        expect(screen.getByRole('button', { name: 'Submit (2)' }))
            .toBeInTheDocument()
        const summary = screen.getByText('Total Days:')
            .closest('section') as HTMLElement
        expect(within(summary)
            .getByText('2'))
            .toBeInTheDocument()
        expect(within(summary)
            .getByText('16.5'))
            .toBeInTheDocument()
    })

    it('states the count and total in the confirmation, and submits nothing on cancel', async () => {
        const user = userEvent.setup()
        renderView([entry({ hoursWorked: '8.50', workDate: '2026-09-07' })])

        await pickRange('2026-09-07', '2026-09-07')
        await waitFor(() => {
            expect(screen.getByLabelText('Select 07-09-2026'))
                .toBeInTheDocument()
        })
        await user.click(screen.getByLabelText('Select 07-09-2026'))
        await user.click(screen.getByRole('button', { name: 'Submit (1)' }))

        const dialog = screen.getByRole('dialog')
        expect(within(dialog)
            .getByText(/about to submit 1 timesheet entry totaling 8.5 hours/))
            .toBeInTheDocument()

        await user.click(within(dialog)
            .getByRole('button', { name: 'Cancel' }))

        expect(mockSubmit).not.toHaveBeenCalled()
    })

    it('saves then submits the selected entries and reports the refreshed view', async () => {
        const user = userEvent.setup()
        const saved = timesheet([entry({ hoursWorked: '8.50', id: 'e1', workDate: '2026-09-07' })])
        const submitted = timesheet([
            entry({
                hoursWorked: '8.50',
                id: 'e1',
                status: TimesheetEntryStatus.SUBMITTED,
                workDate: '2026-09-07',
            }),
        ])
        mockSave.mockResolvedValue(saved)
        mockSubmit.mockResolvedValue(submitted)

        const { onTimesheetChange }: { onTimesheetChange: jest.Mock } = renderView([
            entry({ hoursWorked: '8.50', id: 'e1', workDate: '2026-09-07' }),
        ])

        await pickRange('2026-09-07', '2026-09-07')
        await waitFor(() => {
            expect(screen.getByLabelText('Select 07-09-2026'))
                .toBeInTheDocument()
        })
        await user.click(screen.getByLabelText('Select 07-09-2026'))
        await user.click(screen.getByRole('button', { name: 'Submit (1)' }))
        await user.click(
            within(screen.getByRole('dialog'))
                .getByRole('button', { name: 'Submit' }),
        )

        await waitFor(() => {
            expect(mockSubmit)
                .toHaveBeenCalledWith('eng-1', 'asg-1', { entryIds: ['e1'] })
        })
        expect(mockSave)
            .toHaveBeenCalledWith('eng-1', 'asg-1', {
                entries: [{ hoursWorked: '8.50', remarks: 'Sprint planning', workDate: '2026-09-07' }],
            })
        expect(onTimesheetChange)
            .toHaveBeenLastCalledWith(submitted)
    })

    it('refuses to submit a selected row with no hours', async () => {
        const user = userEvent.setup()
        renderView()

        await pickRange('2026-09-07', '2026-09-07')
        await waitFor(() => {
            expect(screen.getByLabelText('Select 07-09-2026'))
                .toBeInTheDocument()
        })
        await user.click(screen.getByLabelText('Select 07-09-2026'))
        await user.click(screen.getByRole('button', { name: 'Submit (1)' }))

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Some selected rows have no hours entered.')
    })

    it('refuses to save while a row holds invalid hours', async () => {
        const user = userEvent.setup()
        renderView([entry({ hoursWorked: '8', workDate: '2026-09-07' })])

        await pickRange('2026-09-07', '2026-09-07')
        await waitFor(() => {
            expect(screen.getByLabelText('Hours worked on 07-09-2026'))
                .toBeInTheDocument()
        })

        const hoursInput = screen.getByLabelText('Hours worked on 07-09-2026')
        await user.clear(hoursInput)
        await user.type(hoursInput, '25')
        await user.click(screen.getByRole('button', { name: 'Save' }))

        expect(mockSave).not.toHaveBeenCalled()
        expect(screen.getByText('Fix the highlighted hours before saving.'))
            .toBeInTheDocument()
    })

    it('sends an edited submitted row back to the server, which returns it as a draft', async () => {
        const user = userEvent.setup()
        const afterEdit = timesheet([
            entry({
                hoursWorked: '9.50',
                id: 'e1',
                status: TimesheetEntryStatus.DRAFT,
                workDate: '2026-09-07',
            }),
        ])
        mockSave.mockResolvedValue(afterEdit)

        const { onTimesheetChange }: { onTimesheetChange: jest.Mock } = renderView([
            entry({
                hoursWorked: '8.50',
                id: 'e1',
                status: TimesheetEntryStatus.SUBMITTED,
                submittedAt: '2026-09-08T09:00:00.000Z',
                workDate: '2026-09-07',
            }),
        ])

        await pickRange('2026-09-07', '2026-09-07')
        await waitFor(() => {
            expect(screen.getByDisplayValue('8.50'))
                .toBeInTheDocument()
        })

        const hoursInput = screen.getByLabelText('Hours worked on 07-09-2026')
        await user.clear(hoursInput)
        await user.type(hoursInput, '9.5')
        await user.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => {
            expect(mockSave)
                .toHaveBeenCalledWith('eng-1', 'asg-1', {
                    entries: [
                        { hoursWorked: '9.5', remarks: 'Sprint planning', workDate: '2026-09-07' },
                    ],
                })
        })
        // The reset to draft is the server's decision; the view just renders what comes back.
        expect(onTimesheetChange)
            .toHaveBeenCalledWith(afterEdit)
    })

    it('surfaces the API message when saving fails', async () => {
        const user = userEvent.setup()
        mockSave.mockRejectedValue({
            response: { data: { message: 'Hours worked cannot exceed 24 for a single day.' } },
        })
        renderView([entry({ hoursWorked: '8', workDate: '2026-09-07' })])

        await pickRange('2026-09-07', '2026-09-07')
        await waitFor(() => {
            expect(screen.getByLabelText('Hours worked on 07-09-2026'))
                .toBeInTheDocument()
        })

        const hoursInput = screen.getByLabelText('Hours worked on 07-09-2026')
        await user.clear(hoursInput)
        await user.type(hoursInput, '9')
        await user.click(screen.getByRole('button', { name: 'Save' }))

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Hours worked cannot exceed 24 for a single day.')
    })

    it('leaves approved rows read-only', async () => {
        renderView([
            entry({
                approvalComment: 'Approved for week 37',
                approvedAt: '2026-09-12T10:04:11.000Z',
                approvedByHandle: 'maryj',
                status: TimesheetEntryStatus.APPROVED,
                workDate: '2026-09-07',
            }),
        ])

        await pickRange('2026-09-07', '2026-09-07')

        await waitFor(() => {
            expect(screen.getByText('Approved'))
                .toBeInTheDocument()
        })
        expect(screen.queryByLabelText('Hours worked on 07-09-2026')).not.toBeInTheDocument()
        expect(screen.getByLabelText('Select 07-09-2026'))
            .toBeDisabled()
    })
})
