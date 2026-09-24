/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports,
   unicorn/no-null -- the entry fixture mirrors the API payload, which uses null for absent values */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { TimesheetEntry, TimesheetView } from '../../lib/models'
import { TimesheetEntryStatus, TimesheetViewerRole } from '../../lib/models'
import { approveTimesheetEntries, getTimesheet } from '../../lib/services'

import ManagerTimesheetView from './ManagerTimesheetView'

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
    InputDatePicker: (props: { label: string }) => (
        <label>
            {props.label}
            <input type='text' />
        </label>
    ),
}), { virtual: true })

jest.mock('../../lib/services', () => ({
    approveTimesheetEntries: jest.fn(),
    getTimesheet: jest.fn(),
}))

const mockApprove = approveTimesheetEntries as jest.MockedFunction<typeof approveTimesheetEntries>
const mockGetTimesheet = getTimesheet as jest.MockedFunction<typeof getTimesheet>

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
    status: TimesheetEntryStatus.SUBMITTED,
    submittedAt: '2026-09-08T09:00:00.000Z',
    workDate: '2026-09-07',
    ...overrides,
} as TimesheetEntry)

const timesheet = (entries: TimesheetEntry[]): TimesheetView => ({
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
    viewerRole: TimesheetViewerRole.MANAGER,
})

const submittedPair = [
    entry({ id: 'e1', workDate: '2026-09-07' }),
    entry({ hoursWorked: '8.00', id: 'e2', workDate: '2026-09-08' }),
]

const renderView = (entries: TimesheetEntry[] = submittedPair): {
    onTimesheetChange: jest.Mock
} & ReturnType<typeof render> => {
    const onTimesheetChange = jest.fn()
    const utils = render(
        <ManagerTimesheetView
            onTimesheetChange={onTimesheetChange}
            timesheet={timesheet(entries)}
        />,
    )

    return { onTimesheetChange, ...utils }
}

describe('ManagerTimesheetView', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockGetTimesheet.mockResolvedValue(timesheet(submittedPair))
    })

    it('defaults to Pending Approval and shows no date pickers', async () => {
        renderView()

        await waitFor(() => {
            expect(screen.getByLabelText('Status'))
                .toHaveValue(TimesheetEntryStatus.SUBMITTED)
        })
        expect(screen.queryByLabelText('From Date')).not.toBeInTheDocument()
        expect(screen.queryByLabelText('To Date')).not.toBeInTheDocument()
    })

    it('shows submitted rows read-only, with selectable checkboxes', async () => {
        renderView()

        await waitFor(() => {
            expect(screen.getByText('07-09-2026'))
                .toBeInTheDocument()
        })
        expect(screen.queryByLabelText('Hours worked on 07-09-2026')).not.toBeInTheDocument()
        expect(screen.getByLabelText('Select 07-09-2026'))
            .toBeEnabled()
    })

    it('shows totals and a counted approve button once rows are selected', async () => {
        const user = userEvent.setup()
        renderView()

        await waitFor(() => {
            expect(screen.getByLabelText('Select 07-09-2026'))
                .toBeInTheDocument()
        })
        await user.click(screen.getByLabelText('Select 07-09-2026'))
        await user.click(screen.getByLabelText('Select 08-09-2026'))

        expect(screen.getByRole('button', { name: 'Approve (2)' }))
            .toBeInTheDocument()
        const summary = screen.getByText('Total Selected Days:')
            .closest('section') as HTMLElement
        expect(within(summary)
            .getByText('2'))
            .toBeInTheDocument()
        expect(within(summary)
            .getByText('16.5'))
            .toBeInTheDocument()
    })

    it('requires an approval comment before approving', async () => {
        const user = userEvent.setup()
        renderView()

        await waitFor(() => {
            expect(screen.getByLabelText('Select 07-09-2026'))
                .toBeInTheDocument()
        })
        await user.click(screen.getByLabelText('Select 07-09-2026'))
        await user.click(screen.getByRole('button', { name: 'Approve (1)' }))

        const dialog = screen.getByRole('dialog')
        expect(within(dialog)
            .getByText(/about to approve 1 timesheet entry totaling 8.5 hours/))
            .toBeInTheDocument()
        expect(within(dialog)
            .getByRole('button', { name: 'Approve' }))
            .toBeDisabled()

        await user.type(within(dialog)
            .getByLabelText('Approval comment'), 'Approved for week 37')

        expect(within(dialog)
            .getByRole('button', { name: 'Approve' }))
            .toBeEnabled()
    })

    it('approves the selected entries with the comment', async () => {
        const user = userEvent.setup()
        mockApprove.mockResolvedValue({ approved: ['e1'], skipped: [] })
        renderView()

        await waitFor(() => {
            expect(screen.getByLabelText('Select 07-09-2026'))
                .toBeInTheDocument()
        })
        await user.click(screen.getByLabelText('Select 07-09-2026'))
        await user.click(screen.getByRole('button', { name: 'Approve (1)' }))

        const dialog = screen.getByRole('dialog')
        await user.type(within(dialog)
            .getByLabelText('Approval comment'), 'Approved for week 37')
        await user.click(within(dialog)
            .getByRole('button', { name: 'Approve' }))

        await waitFor(() => {
            expect(mockApprove)
                .toHaveBeenCalledWith('eng-1', 'asg-1', {
                    approvalComment: 'Approved for week 37',
                    entryIds: ['e1'],
                    overrideReason: undefined,
                })
        })
    })

    it('reports a partial approval naming the manager who got there first', async () => {
        const user = userEvent.setup()
        mockApprove.mockResolvedValue({
            approved: ['e1'],
            skipped: [{
                approvedByHandle: 'robertl',
                currentStatus: TimesheetEntryStatus.APPROVED,
                id: 'e2',
            }],
        })
        renderView()

        await waitFor(() => {
            expect(screen.getByLabelText('Select 07-09-2026'))
                .toBeInTheDocument()
        })
        await user.click(screen.getByLabelText('Select 07-09-2026'))
        await user.click(screen.getByLabelText('Select 08-09-2026'))
        await user.click(screen.getByRole('button', { name: 'Approve (2)' }))

        const dialog = screen.getByRole('dialog')
        await user.type(within(dialog)
            .getByLabelText('Approval comment'), 'ok')
        await user.click(within(dialog)
            .getByRole('button', { name: 'Approve' }))

        expect(await screen.findByRole('status'))
            .toHaveTextContent('1 of 2 approved. 1 entry was already handled by robertl.')
    })

    it('surfaces the API message when approval fails', async () => {
        const user = userEvent.setup()
        mockApprove.mockRejectedValue({
            response: { data: { message: 'approvalComment is required.' } },
        })
        renderView()

        await waitFor(() => {
            expect(screen.getByLabelText('Select 07-09-2026'))
                .toBeInTheDocument()
        })
        await user.click(screen.getByLabelText('Select 07-09-2026'))
        await user.click(screen.getByRole('button', { name: 'Approve (1)' }))

        const dialog = screen.getByRole('dialog')
        await user.type(within(dialog)
            .getByLabelText('Approval comment'), 'ok')
        await user.click(within(dialog)
            .getByRole('button', { name: 'Approve' }))

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('approvalComment is required.')
    })

    it('brings back the date pickers and drops selection when Approved is picked', async () => {
        const user = userEvent.setup()
        renderView()

        await waitFor(() => {
            expect(screen.getByLabelText('Status'))
                .toBeInTheDocument()
        })
        await user.selectOptions(screen.getByLabelText('Status'), TimesheetEntryStatus.APPROVED)

        expect(screen.getByLabelText('From Date'))
            .toBeInTheDocument()
        expect(screen.getByLabelText('To Date'))
            .toBeInTheDocument()
        await waitFor(() => {
            expect(mockGetTimesheet)
                .toHaveBeenCalledWith('eng-1', 'asg-1', expect.objectContaining({
                    status: TimesheetEntryStatus.APPROVED,
                }))
        })
    })

    it('shows approval details recorded by another manager, read-only', async () => {
        const user = userEvent.setup()
        const approved = [entry({
            approvalComment: 'Approved for week 37',
            approvedAt: '2026-09-12T10:04:11.000Z',
            approvedByHandle: 'robertl',
            id: 'e1',
            status: TimesheetEntryStatus.APPROVED,
        })]
        mockGetTimesheet.mockResolvedValue(timesheet(approved))

        const { rerender }: { rerender: (ui: JSX.Element) => void } = render(
            <ManagerTimesheetView
                onTimesheetChange={jest.fn()}
                timesheet={timesheet(submittedPair)}
            />,
        )

        await user.selectOptions(screen.getByLabelText('Status'), TimesheetEntryStatus.APPROVED)
        rerender(
            <ManagerTimesheetView
                onTimesheetChange={jest.fn()}
                timesheet={timesheet(approved)}
            />,
        )

        expect(await screen.findByText(/by robertl/))
            .toBeInTheDocument()
        expect(screen.getByText(/Approved for week 37/))
            .toBeInTheDocument()
        expect(screen.getByLabelText('Select 07-09-2026'))
            .toBeDisabled()
    })
})
