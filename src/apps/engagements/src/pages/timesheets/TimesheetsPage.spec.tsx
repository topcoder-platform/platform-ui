/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen } from '@testing-library/react'

import type { TimesheetView } from '../../lib/models'
import { TimesheetViewerRole } from '../../lib/models'
import { getTimesheet } from '../../lib/services'

import TimesheetsPage from './TimesheetsPage'

const mockParams = {
    assignmentId: 'asg-1',
    engagementId: 'eng-1',
}

jest.mock('react-router-dom', () => ({
    useParams: () => mockParams,
}))

jest.mock('~/libs/ui', () => ({
    ContentLayout: (props: { children: React.ReactNode, title: string }) => (
        <div>
            <h1>{props.title}</h1>
            {props.children}
        </div>
    ),
    LoadingSpinner: () => <div>loading-spinner</div>,
}), { virtual: true })

jest.mock('../../components', () => ({
    EngagementsTabs: (props: { activeTab: string }) => (
        <div data-testid='engagements-tabs' data-active-tab={props.activeTab} />
    ),
}))

jest.mock('./AdminTimesheetView', () => ({
    __esModule: true,
    default: () => <div>admin-view</div>,
}))
jest.mock('./ManagerTimesheetView', () => ({
    __esModule: true,
    default: () => <div>manager-view</div>,
}))
jest.mock('./MemberTimesheetView', () => ({
    __esModule: true,
    default: () => <div>member-view</div>,
}))
jest.mock('./TmTimesheetView', () => ({
    __esModule: true,
    default: () => <div>tm-view</div>,
}))
jest.mock('./TimesheetHeader', () => ({
    __esModule: true,
    default: () => <div>header</div>,
}))
jest.mock('../../lib/services', () => ({
    getTimesheet: jest.fn(),
}))

const mockGetTimesheet = getTimesheet as jest.MockedFunction<typeof getTimesheet>

const timesheet = (viewerRole: TimesheetViewerRole): TimesheetView => ({
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
    entries: [],
    managers: [],
    viewerRole,
})

describe('TimesheetsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders the TM view when the API returns TM', async () => {
        mockGetTimesheet.mockResolvedValue(timesheet(TimesheetViewerRole.TM))

        render(<TimesheetsPage />)

        expect(await screen.findByText('tm-view'))
            .toBeInTheDocument()
        expect(screen.getByTestId('engagements-tabs'))
            .toHaveAttribute('data-active-tab', 'timesheets')
    })
})
