/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen } from '@testing-library/react'

import type { TimesheetEntry, TimesheetView } from '../../lib/models'
import { TimesheetEntryStatus, TimesheetViewerRole } from '../../lib/models'

import TmTimesheetView from './TmTimesheetView'

jest.mock('../../components/timesheet-grid', () => ({
    TimesheetGrid: (props: { rows: Array<{ id?: string }> }) => (
        <div data-testid='timesheet-grid' data-rows={props.rows.length} />
    ),
}))

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
    it('shows only submitted entries in read-only mode', () => {
        render(
            <TmTimesheetView
                timesheet={timesheet([
                    entry({ id: 'submitted', status: TimesheetEntryStatus.SUBMITTED }),
                    entry({ id: 'approved', status: TimesheetEntryStatus.APPROVED }),
                ])}
            />,
        )

        expect(screen.getByTestId('timesheet-grid'))
            .toHaveAttribute('data-rows', '1')
        expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
    })
})
