/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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
    BaseModal: (props: {
        children: React.ReactNode
        open: boolean
        title?: string
    }) => (props.open
        ? (
            <div role='dialog'>
                <h2>{props.title}</h2>
                {props.children}
            </div>
        )
        : <></>),
    Button: (props: { label: string, onClick?: () => void }) => (
        <button onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
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

jest.mock('../../components/engagement-managers', () => ({
    EngagementManagers: () => <div>engagement-managers</div>,
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
    default: (props: { onEditManagers?: () => void }) => (
        <div>
            <span>header</span>
            {props.onEditManagers && (
                <button onClick={props.onEditManagers} type='button'>
                    edit-managers
                </button>
            )}
        </div>
    ),
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

    it('opens managers modal from the header action for administrators', async () => {
        const user = userEvent.setup()
        mockGetTimesheet.mockResolvedValue(timesheet(TimesheetViewerRole.ADMINISTRATOR))

        render(<TimesheetsPage />)

        expect(await screen.findByText('admin-view'))
            .toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'edit-managers' }))

        expect(screen.getByRole('dialog'))
            .toHaveTextContent('engagement-managers')
    })
})
