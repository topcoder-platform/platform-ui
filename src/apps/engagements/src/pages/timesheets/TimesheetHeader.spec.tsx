/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports,
   unicorn/no-null -- the assignment fixture mirrors the API payload, which uses null */
import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'

import type { TimesheetAssignment } from '../../lib/models'

import TimesheetHeader from './TimesheetHeader'

jest.mock('~/libs/ui', () => ({
    Button: (props: { label: string, onClick?: () => void }) => (
        <button onClick={props.onClick} type='button'>{props.label}</button>
    ),
}), { virtual: true })

const assignment = (overrides: Partial<TimesheetAssignment> = {}): TimesheetAssignment => ({
    endDate: '2026-12-31',
    hoursLeft: null,
    id: 'asg-1',
    memberHandle: 'johnsmith',
    memberId: '1001',
    memberName: 'John Smith',
    standardHoursPerDay: 8,
    startDate: '2026-09-01',
    status: 'ASSIGNED',
    totalHours: null,
    ...overrides,
})

const renderHeader = (
    value: TimesheetAssignment,
    showAssignmentHours: boolean,
): ReturnType<typeof render> => render(
    <TimesheetHeader
        assignment={value}
        engagementTitle='Senior Frontend Engineer'
        managers={[]}
        showAssignmentHours={showAssignmentHours}
    />,
)

/** The value shown next to a header fact's label. */
const factValue = (label: string): string | null | undefined => (
    screen.getByText(label).nextElementSibling?.textContent
)

describe('TimesheetHeader', () => {
    it('shows a reviewer the total hours and the hours left', () => {
        renderHeader(assignment({ hoursLeft: 312.5, totalHours: 480 }), true)

        expect(factValue('Total Hours'))
            .toBe('480')
        expect(factValue('Hours Left'))
            .toBe('312.5')
    })

    it('leaves hours left blank when the assignment has no total hours', () => {
        renderHeader(assignment(), true)

        expect(factValue('Total Hours'))
            .toBe('Not set')
        expect(factValue('Hours Left'))
            .toBe('')
    })

    it('says hours left is unavailable when payments could not be read', () => {
        renderHeader(assignment({ hoursLeft: null, totalHours: 480 }), true)

        expect(factValue('Hours Left'))
            .toBe('Unavailable')
    })

    it('hides the hours from the member', () => {
        renderHeader(assignment({ hoursLeft: 312.5, totalHours: 480 }), false)

        expect(screen.queryByText('Total Hours')).not.toBeInTheDocument()
        expect(screen.queryByText('Hours Left')).not.toBeInTheDocument()
    })
})
