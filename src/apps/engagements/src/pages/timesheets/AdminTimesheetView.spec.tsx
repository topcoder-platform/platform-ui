/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports,
   unicorn/no-null -- the entry fixture mirrors the API payload, which uses null for absent values */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { TimesheetEntry, TimesheetView } from '../../lib/models'
import { TimesheetEntryStatus, TimesheetViewerRole } from '../../lib/models'
import {
    approveTimesheetEntries,
    getTimesheet,
    getTimesheetEntryAudit,
    reopenTimesheetEntries,
    saveTimesheetEntries,
    submitTimesheetEntries,
} from '../../lib/services'

import AdminTimesheetView from './AdminTimesheetView'

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
    LoadingSpinner: () => <div>loading</div>,
}), { virtual: true })

jest.mock('../../components/engagement-managers', () => ({
    EngagementManagers: () => <div>engagement-managers</div>,
}))

jest.mock('../../lib/services', () => ({
    approveTimesheetEntries: jest.fn(),
    getTimesheet: jest.fn(),
    getTimesheetEntryAudit: jest.fn()
        .mockResolvedValue([]),
    reopenTimesheetEntries: jest.fn(),
    saveTimesheetEntries: jest.fn(),
    submitTimesheetEntries: jest.fn(),
}))

const mockApprove = approveTimesheetEntries as jest.MockedFunction<typeof approveTimesheetEntries>
const mockGetTimesheet = getTimesheet as jest.MockedFunction<typeof getTimesheet>
const mockReopen = reopenTimesheetEntries as jest.MockedFunction<typeof reopenTimesheetEntries>
const mockSave = saveTimesheetEntries as jest.MockedFunction<typeof saveTimesheetEntries>
const mockSubmit = submitTimesheetEntries as jest.MockedFunction<typeof submitTimesheetEntries>
const mockGetAudit = getTimesheetEntryAudit as jest.MockedFunction<typeof getTimesheetEntryAudit>

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
    viewerRole: TimesheetViewerRole.ADMINISTRATOR,
})

const renderView = (entries: TimesheetEntry[]): {
    onTimesheetChange: jest.Mock
} & ReturnType<typeof render> => {
    const onTimesheetChange = jest.fn()
    const utils = render(
        <AdminTimesheetView
            onTimesheetChange={onTimesheetChange}
            timesheet={timesheet(entries)}
        />,
    )

    return { onTimesheetChange, ...utils }
}

describe('AdminTimesheetView', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockGetTimesheet.mockResolvedValue(timesheet([entry()]))
        mockGetAudit.mockResolvedValue([])
    })

    it('mounts the manager assignment control in the engagement details', () => {
        renderView([entry()])

        expect(screen.getByText('engagement-managers'))
            .toBeInTheDocument()
    })

    it('lets an administrator edit any row, including a submitted one', () => {
        renderView([entry({ status: TimesheetEntryStatus.SUBMITTED })])

        expect(screen.getByLabelText('Hours worked on 07-09-2026'))
            .toBeEnabled()
        expect(screen.getByLabelText('Remarks for 07-09-2026'))
            .toBeEnabled()
    })

    it('saves a draft edit without a reason, because nobody is being overridden', async () => {
        const user = userEvent.setup()
        mockSave.mockResolvedValue(timesheet([entry({ hoursWorked: '9.00' })]))
        renderView([entry()])

        const hoursInput = screen.getByLabelText('Hours worked on 07-09-2026')
        await user.clear(hoursInput)
        await user.type(hoursInput, '9')
        await user.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => {
            expect(mockSave)
                .toHaveBeenCalledWith('eng-1', 'asg-1', {
                    entries: [{ hoursWorked: '9', remarks: 'Sprint planning', workDate: '2026-09-07' }],
                    overrideReason: undefined,
                })
        })
    })

    it('keeps an approved row editable so a correction can be typed', () => {
        renderView([entry({ status: TimesheetEntryStatus.APPROVED })])

        expect(screen.getByLabelText('Hours worked on 07-09-2026'))
            .toBeEnabled()
        expect(screen.getByLabelText('Select 07-09-2026'))
            .toBeEnabled()
    })

    it('requires a reason before correcting an approved entry', async () => {
        const user = userEvent.setup()
        mockSave.mockResolvedValue(timesheet([entry({ status: TimesheetEntryStatus.APPROVED })]))
        renderView([entry({ status: TimesheetEntryStatus.APPROVED })])

        await user.click(screen.getByRole('button', { name: 'Save' }))

        const dialog = screen.getByRole('dialog')
        expect(within(dialog)
            .getByText('Correct timesheet entries'))
            .toBeInTheDocument()
        expect(within(dialog)
            .getByRole('button', { name: 'Save correction' }))
            .toBeDisabled()
        expect(mockSave).not.toHaveBeenCalled()

        await user.type(within(dialog)
            .getByLabelText('Override reason'), 'Payroll correction')
        await user.click(within(dialog)
            .getByRole('button', { name: 'Save correction' }))

        await waitFor(() => {
            expect(mockSave)
                .toHaveBeenCalledWith('eng-1', 'asg-1', expect.objectContaining({
                    overrideReason: 'Payroll correction',
                }))
        })
    })

    it('requires a reason before submitting on the member’s behalf', async () => {
        const user = userEvent.setup()
        mockSubmit.mockResolvedValue(timesheet([entry({ status: TimesheetEntryStatus.SUBMITTED })]))
        renderView([entry({ id: 'e1' })])

        await user.click(screen.getByLabelText('Select 07-09-2026'))
        await user.click(screen.getByRole('button', { name: 'Submit on behalf (1)' }))

        const dialog = screen.getByRole('dialog')
        expect(within(dialog)
            .getByText('Submit on the member’s behalf'))
            .toBeInTheDocument()
        expect(mockSubmit).not.toHaveBeenCalled()

        await user.type(within(dialog)
            .getByLabelText('Override reason'), 'Portal outage')
        await user.click(within(dialog)
            .getByRole('button', { name: 'Submit on behalf' }))

        await waitFor(() => {
            expect(mockSubmit)
                .toHaveBeenCalledWith('eng-1', 'asg-1', {
                    entryIds: ['e1'],
                    overrideReason: 'Portal outage',
                })
        })
    })

    it('requires a reason before reopening an approved entry', async () => {
        const user = userEvent.setup()
        mockReopen.mockResolvedValue(timesheet([entry({ status: TimesheetEntryStatus.DRAFT })]))
        renderView([entry({ id: 'e1', status: TimesheetEntryStatus.APPROVED })])

        await user.click(screen.getByLabelText('Select 07-09-2026'))
        await user.click(screen.getByRole('button', { name: 'Reopen (1)' }))

        const dialog = screen.getByRole('dialog')
        expect(within(dialog)
            .getByText('Reopen approved entries'))
            .toBeInTheDocument()
        expect(mockReopen).not.toHaveBeenCalled()

        await user.type(within(dialog)
            .getByLabelText('Override reason'), 'Wrong hours reported')
        await user.click(within(dialog)
            .getByRole('button', { name: 'Reopen' }))

        await waitFor(() => {
            expect(mockReopen)
                .toHaveBeenCalledWith('eng-1', 'asg-1', {
                    entryIds: ['e1'],
                    overrideReason: 'Wrong hours reported',
                })
        })
    })

    it('requires both a comment and a reason to approve on a manager’s behalf', async () => {
        const user = userEvent.setup()
        mockApprove.mockResolvedValue({ approved: ['e1'], skipped: [] })
        renderView([entry({ id: 'e1', status: TimesheetEntryStatus.SUBMITTED })])

        await user.click(screen.getByLabelText('Select 07-09-2026'))
        await user.click(screen.getByRole('button', { name: 'Approve on behalf (1)' }))

        const dialog = screen.getByRole('dialog')
        await user.type(within(dialog)
            .getByLabelText('Approval comment'), 'Approved for week 37')
        // The comment alone is not enough: acting for a manager needs a recorded reason too.
        expect(within(dialog)
            .getByRole('button', { name: 'Approve' }))
            .toBeDisabled()

        await user.type(
            within(dialog)
                .getByLabelText(/Override reason/),
            'Manager on leave',
        )
        await user.click(within(dialog)
            .getByRole('button', { name: 'Approve' }))

        await waitFor(() => {
            expect(mockApprove)
                .toHaveBeenCalledWith('eng-1', 'asg-1', {
                    approvalComment: 'Approved for week 37',
                    entryIds: ['e1'],
                    overrideReason: 'Manager on leave',
                })
        })
    })

    it('offers reopen only for approved rows and submit only for drafts', async () => {
        const user = userEvent.setup()
        renderView([entry({ id: 'e1', status: TimesheetEntryStatus.SUBMITTED })])

        await user.click(screen.getByLabelText('Select 07-09-2026'))

        expect(screen.getByRole('button', { name: 'Reopen (0)' }))
            .toBeDisabled()
        expect(screen.getByRole('button', { name: 'Submit on behalf (0)' }))
            .toBeDisabled()
        expect(screen.getByRole('button', { name: 'Approve on behalf (1)' }))
            .toBeEnabled()
    })

    it('opens the audit history for a single selected row', async () => {
        const user = userEvent.setup()
        renderView([entry({ id: 'e1' })])

        await user.click(screen.getByLabelText('Select 07-09-2026'))
        await user.click(screen.getByRole('button', { name: 'Audit history' }))
        await waitFor(() => {
            expect(screen.getByRole('dialog'))
                .toBeInTheDocument()
        })

        expect(screen.getByRole('dialog'))
            .toHaveTextContent('Audit history - 07-09-2026')
    })

    it('badges a reopened row', () => {
        renderView([entry({ reopenedAt: '2026-09-14T00:00:00.000Z' })])

        expect(screen.getByText('Reopened'))
            .toBeInTheDocument()
    })

    it('surfaces the API message when an override fails', async () => {
        const user = userEvent.setup()
        mockReopen.mockRejectedValue({
            response: { data: { message: 'Only approved timesheet entries can be reopened.' } },
        })
        renderView([entry({ id: 'e1', status: TimesheetEntryStatus.APPROVED })])

        await user.click(screen.getByLabelText('Select 07-09-2026'))
        await user.click(screen.getByRole('button', { name: 'Reopen (1)' }))
        await user.type(
            within(screen.getByRole('dialog'))
                .getByLabelText('Override reason'),
            'Wrong hours',
        )
        await user.click(within(screen.getByRole('dialog'))
            .getByRole('button', { name: 'Reopen' }))

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Only approved timesheet entries can be reopened.')
    })
})
