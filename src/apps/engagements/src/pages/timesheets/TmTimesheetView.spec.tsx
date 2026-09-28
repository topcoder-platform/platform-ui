/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { TimesheetEntry, TimesheetView } from '../../lib/models'
import { TimesheetEntryStatus, TimesheetViewerRole } from '../../lib/models'
import { approveTimesheetEntries, getTimesheet } from '../../lib/services'

import TmTimesheetView from './TmTimesheetView'

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
    InputDatePicker: (props: {
        date?: Date
        disabled?: boolean
        label: string
        onChange: (date: Date | null) => void
    }) => {
        const handleChange = function handleChange(
            event: React.ChangeEvent<HTMLInputElement>,
        ): void {
            const value = event.target.value
            if (!value) {
                props.onChange(null)
                return
            }

            const [year, month, day] = value.split('-')
                .map(Number)
            props.onChange(new Date(year, month - 1, day))
        }

        return (
            <label>
                {props.label}
                <input
                    disabled={props.disabled}
                    onChange={handleChange}
                    type='date'
                    value={props.date
                        ? `${props.date.getFullYear()}-${String(props.date.getMonth() + 1)
                            .padStart(2, '0')}-${String(props.date.getDate())
                            .padStart(2, '0')}`
                        : ''}
                />
            </label>
        )
    },
    InputSelect: (props: {
        label: string
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
        options: Array<{ label?: React.ReactNode, value: string }>
        value?: string
    }) => (
        <label>
            {props.label}
            <select
                onChange={function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
                    props.onChange({
                        target: { value: event.target.value },
                    } as React.ChangeEvent<HTMLInputElement>)
                }}
                value={props.value}
            >
                {props.options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label ?? option.value}
                    </option>
                ))}
            </select>
        </label>
    ),
}), { virtual: true })

jest.mock('../../components/timesheet-grid', () => ({
    TimesheetGrid: (props: {
        onSelectionChange: (dates: string[]) => void
        rows: Array<{ id?: string, workDate: string }>
    }) => (
        <div data-testid='timesheet-grid' data-rows={props.rows.length}>
            <button
                onClick={function onSelectFirst() {
                    const first = props.rows[0]
                    props.onSelectionChange(first ? [first.workDate] : [])
                }}
                type='button'
            >
                select-first
            </button>
        </div>
    ),
}))

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
    viewerRole: TimesheetViewerRole.TM,
})

describe('TmTimesheetView', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockApprove.mockResolvedValue({ approved: ['submitted'], skipped: [] })
        mockGetTimesheet.mockResolvedValue(timesheet([
            entry({ id: 'submitted', status: TimesheetEntryStatus.SUBMITTED }),
        ]))
    })

    it('shows only submitted entries', () => {
        render(
            <TmTimesheetView
                onTimesheetChange={jest.fn()}
                timesheet={timesheet([
                    entry({ id: 'submitted', status: TimesheetEntryStatus.SUBMITTED }),
                    entry({ id: 'approved', status: TimesheetEntryStatus.APPROVED }),
                ])}
            />,
        )

        expect(screen.getByTestId('timesheet-grid'))
            .toHaveAttribute('data-rows', '1')
    })

    it('lets a TM approve selected submitted entries', async () => {
        const user = userEvent.setup()
        const onTimesheetChange = jest.fn()
        render(
            <TmTimesheetView
                onTimesheetChange={onTimesheetChange}
                timesheet={timesheet([
                    entry({ id: 'submitted', status: TimesheetEntryStatus.SUBMITTED }),
                ])}
            />,
        )

        await user.click(screen.getByRole('button', { name: 'select-first' }))
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
                    entryIds: ['submitted'],
                })
            expect(mockGetTimesheet)
                .toHaveBeenCalledWith(
                    'eng-1',
                    'asg-1',
                    expect.objectContaining({ status: TimesheetEntryStatus.SUBMITTED }),
                )
            expect(onTimesheetChange)
                .toHaveBeenCalled()
        })
    })
})
