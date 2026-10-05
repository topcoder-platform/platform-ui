/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TimesheetEntryStatus } from '../../lib/models'
import type { TimesheetRow } from '../../lib/utils'

import TimesheetGrid from './TimesheetGrid'

const row = (overrides: Partial<TimesheetRow> = {}): TimesheetRow => ({
    dayLabel: 'Monday',
    displayDate: '07-09-2026',
    hoursWorked: '8.5',
    isPaid: false,
    outsideAssignmentWindow: false,
    remarks: 'Sprint planning',
    status: TimesheetEntryStatus.DRAFT,
    workDate: '2026-09-07',
    ...overrides,
})

/** Handlers the grid needs but these assertions do not inspect. */
function noop(): void {
    // no-op
}

function selectableWhenHoursEntered(candidate: TimesheetRow): boolean {
    return candidate.hoursWorked !== ''
}

describe('TimesheetGrid', () => {

    it('renders every column with the date in DD-MM-YYYY and the day of the week', () => {
        render(
            <TimesheetGrid onSelectionChange={noop} rows={[row()]} selectedDates={[]} />,
        )

        expect(screen.getByText('07-09-2026'))
            .toBeInTheDocument()
        expect(screen.getByText('Monday'))
            .toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Hours Worked' }))
            .toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Remarks' }))
            .toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Status' }))
            .toBeInTheDocument()
    })

    it('shows a draft status as a dash', () => {
        render(
            <TimesheetGrid onSelectionChange={noop} rows={[row()]} selectedDates={[]} />,
        )

        expect(screen.getByText('-'))
            .toBeInTheDocument()
    })

    it('reports an inline error for negative hours', () => {
        render(
            <TimesheetGrid
                onRowChange={noop}
                onSelectionChange={noop}
                rows={[row({ hoursWorked: '-1' })]}
                selectedDates={[]}
            />,
        )

        expect(screen.getByRole('alert'))
            .toHaveTextContent('Hours cannot be negative.')
    })

    it('reports an inline error for non-numeric hours', () => {
        render(
            <TimesheetGrid
                onRowChange={noop}
                onSelectionChange={noop}
                rows={[row({ hoursWorked: 'abc' })]}
                selectedDates={[]}
            />,
        )

        expect(screen.getByRole('alert'))
            .toHaveTextContent('Hours must be a number.')
    })

    it('blocks above 24 hours but only warns above the standard hours per day', () => {
        const { rerender }: { rerender: (ui: JSX.Element) => void } = render(
            <TimesheetGrid
                onRowChange={noop}
                onSelectionChange={noop}
                rows={[row({ hoursWorked: '25' })]}
                selectedDates={[]}
                standardHoursPerDay={8}
            />,
        )

        expect(screen.getByRole('alert'))
            .toHaveTextContent('Hours cannot exceed 24 for a single day.')

        rerender(
            <TimesheetGrid
                onRowChange={noop}
                onSelectionChange={noop}
                rows={[row({ hoursWorked: '10' })]}
                selectedDates={[]}
                standardHoursPerDay={8}
            />,
        )

        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(screen.getByText('Above the standard 8 hours for this engagement.'))
            .toBeInTheDocument()
    })

    it('passes typed hours up to the caller', async () => {
        const onRowChange = jest.fn()
        const user = userEvent.setup()

        render(
            <TimesheetGrid
                onRowChange={onRowChange}
                onSelectionChange={noop}
                rows={[row({ hoursWorked: '' })]}
                selectedDates={[]}
            />,
        )

        await user.type(screen.getByLabelText('Hours worked on 07-09-2026'), '8')

        expect(onRowChange)
            .toHaveBeenCalledWith('2026-09-07', { hoursWorked: '8' })
    })

    it('renders an approved row read-only with a disabled checkbox and the approval details', () => {
        render(
            <TimesheetGrid
                onRowChange={noop}
                onSelectionChange={noop}
                rows={[row({
                    approvalComment: 'Approved for week 37',
                    approvedAt: '2026-09-12T10:04:11.000Z',
                    approvedByHandle: 'maryj',
                    status: TimesheetEntryStatus.APPROVED,
                })]}
                selectedDates={[]}
            />,
        )

        expect(screen.queryByLabelText('Hours worked on 07-09-2026')).not.toBeInTheDocument()
        expect(screen.queryByLabelText('Remarks for 07-09-2026')).not.toBeInTheDocument()
        expect(screen.getByLabelText('Select 07-09-2026'))
            .toBeDisabled()
        expect(screen.getByText('Approved'))
            .toBeInTheDocument()
        expect(screen.getByText(/by maryj/))
            .toBeInTheDocument()
        expect(screen.getByText(/Approved for week 37/))
            .toBeInTheDocument()
    })

    it('badges a reopened row so it is distinguishable from one never submitted', () => {
        render(
            <TimesheetGrid
                onSelectionChange={noop}
                rows={[
                    row({ reopenedAt: '2026-09-14T00:00:00.000Z', workDate: '2026-09-07' }),
                    row({ displayDate: '08-09-2026', workDate: '2026-09-08' }),
                ]}
                selectedDates={[]}
            />,
        )

        expect(screen.getAllByText('Reopened'))
            .toHaveLength(1)
    })

    it('keeps a submitted row editable, because editing it returns it to draft', () => {
        render(
            <TimesheetGrid
                onRowChange={noop}
                onSelectionChange={noop}
                rows={[row({ status: TimesheetEntryStatus.SUBMITTED })]}
                selectedDates={[]}
            />,
        )

        expect(screen.getByLabelText('Hours worked on 07-09-2026'))
            .toBeEnabled()
        expect(screen.getByText('Submitted'))
            .toBeInTheDocument()
    })

    it('renders no totals footer unless asked, so a view can show its own', () => {
        render(
            <TimesheetGrid onSelectionChange={noop} rows={[row()]} selectedDates={[]} />,
        )

        expect(screen.getByRole('table')
            .querySelector('tfoot'))
            .toBeNull()
    })

    it('totals only the selected rows when the footer is enabled', () => {
        render(
            <TimesheetGrid
                onSelectionChange={noop}
                rows={[
                    row({ hoursWorked: '8.5', workDate: '2026-09-07' }),
                    row({ displayDate: '08-09-2026', hoursWorked: '8', workDate: '2026-09-08' }),
                    row({ displayDate: '09-09-2026', hoursWorked: '9', workDate: '2026-09-09' }),
                ]}
                selectedDates={['2026-09-07', '2026-09-08']}
                showTotals
            />,
        )

        const footer = screen.getByRole('table')
            .querySelector('tfoot') as HTMLElement

        expect(within(footer)
            .getByText('2'))
            .toBeInTheDocument()
        expect(within(footer)
            .getByText('16.5'))
            .toBeInTheDocument()
    })

    it('reports a selection change when a row is picked', async () => {
        const onSelectionChange = jest.fn()
        const user = userEvent.setup()

        render(
            <TimesheetGrid
                onSelectionChange={onSelectionChange}
                rows={[row()]}
                selectedDates={[]}
            />,
        )

        await user.click(screen.getByLabelText('Select 07-09-2026'))

        expect(onSelectionChange)
            .toHaveBeenCalledWith(['2026-09-07'])
    })

    it('selects every selectable row from the header checkbox, skipping approved ones', async () => {
        const onSelectionChange = jest.fn()
        const user = userEvent.setup()

        render(
            <TimesheetGrid
                onSelectionChange={onSelectionChange}
                rows={[
                    row({ workDate: '2026-09-07' }),
                    row({
                        status: TimesheetEntryStatus.APPROVED,
                        workDate: '2026-09-08',
                    }),
                ]}
                selectedDates={[]}
            />,
        )

        await user.click(screen.getByLabelText('Select all rows'))

        expect(onSelectionChange)
            .toHaveBeenCalledWith(['2026-09-07'])
    })

    it('honours a caller-supplied selectability rule', () => {
        render(
            <TimesheetGrid
                isRowSelectable={selectableWhenHoursEntered}
                onSelectionChange={noop}
                rows={[row({ hoursWorked: '' })]}
                selectedDates={[]}
            />,
        )

        expect(screen.getByLabelText('Select 07-09-2026'))
            .toBeDisabled()
    })

    it('renders read-only for every row when told to', () => {
        render(
            <TimesheetGrid
                onSelectionChange={noop}
                readOnly
                rows={[row()]}
                selectedDates={[]}
            />,
        )

        expect(screen.queryByLabelText('Hours worked on 07-09-2026')).not.toBeInTheDocument()
        expect(screen.getByText('8.5'))
            .toBeInTheDocument()
    })

    it('shows the empty message when there are no rows', () => {
        render(
            <TimesheetGrid
                emptyMessage='Pick a date range to start entering hours.'
                onSelectionChange={noop}
                rows={[]}
                selectedDates={[]}
            />,
        )

        expect(screen.getByText('Pick a date range to start entering hours.'))
            .toBeInTheDocument()
    })

    it('flags an entry outside the assignment dates without blocking it', () => {
        render(
            <TimesheetGrid
                onRowChange={noop}
                onSelectionChange={noop}
                rows={[row({ outsideAssignmentWindow: true })]}
                selectedDates={[]}
            />,
        )

        expect(screen.getByText('Outside assignment dates'))
            .toBeInTheDocument()
        expect(screen.getByLabelText('Select 07-09-2026'))
            .toBeEnabled()
    })
})
