/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { TimesheetEngagementListResponse, TimesheetEngagementRow } from '../../lib/models'
import { TimesheetViewerRole } from '../../lib/models'
import { getTimesheetEngagements } from '../../lib/services'

import TimesheetEngagementsPage from './TimesheetEngagementsPage'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}))

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
    }) => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>
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

jest.mock('../../lib/services', () => ({
    getTimesheetEngagements: jest.fn(),
}))

jest.mock('../../engagements.routes', () => ({
    rootRoute: '/engagements',
}))

const mockGetEngagements = getTimesheetEngagements as jest.MockedFunction<
    typeof getTimesheetEngagements
>

const row = (overrides: Partial<TimesheetEngagementRow> = {}): TimesheetEngagementRow => ({
    assigneeHandle: 'johnsmith',
    assigneeId: '1001',
    assigneeName: 'John Smith',
    assignmentId: 'asg-1',
    engagementId: 'eng-1',
    engagementTitle: 'Senior Frontend Engineer',
    timesheetStatus: 'Pending Approval',
    viewerRole: TimesheetViewerRole.MANAGER,
    ...overrides,
})

const response = (
    rows: TimesheetEngagementRow[],
    viewerRole: TimesheetViewerRole,
    totalPages = 1,
): TimesheetEngagementListResponse => ({
    data: rows,
    meta: {
        page: 1,
        perPage: 20,
        totalCount: rows.length,
        totalPages,
        viewerRole,
    },
})

describe('TimesheetEngagementsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('lists one row per assignee with name and handle for a manager', async () => {
        mockGetEngagements.mockResolvedValue(response(
            [
                row(),
                row({
                    assigneeHandle: 'janedoe',
                    assigneeName: 'Jane Doe',
                    assignmentId: 'asg-2',
                }),
            ],
            TimesheetViewerRole.MANAGER,
        ))

        render(<TimesheetEngagementsPage />)

        expect(await screen.findByText('John Smith (johnsmith)'))
            .toBeInTheDocument()
        expect(screen.getByText('Jane Doe (janedoe)'))
            .toBeInTheDocument()
        expect(screen.getAllByRole('button', { name: 'View' }))
            .toHaveLength(2)
    })

    it('hides the administrator filters and status column from a manager', async () => {
        mockGetEngagements.mockResolvedValue(response([row()], TimesheetViewerRole.MANAGER))

        render(<TimesheetEngagementsPage />)

        await screen.findByText('John Smith (johnsmith)')

        expect(screen.queryByLabelText('Engagement title')).not.toBeInTheDocument()
        expect(screen.queryByRole('columnheader', { name: 'Timesheet Status' }))
            .not
            .toBeInTheDocument()
    })

    it('shows the filters and the status column for an administrator', async () => {
        mockGetEngagements.mockResolvedValue(response(
            [row({ viewerRole: TimesheetViewerRole.ADMINISTRATOR })],
            TimesheetViewerRole.ADMINISTRATOR,
        ))

        render(<TimesheetEngagementsPage />)

        expect(await screen.findByLabelText('Engagement title'))
            .toBeInTheDocument()
        expect(screen.getByLabelText('Assignee'))
            .toBeInTheDocument()
        expect(screen.getByLabelText('Manager'))
            .toBeInTheDocument()
        expect(screen.getByLabelText('Timesheet status'))
            .toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Timesheet Status' }))
            .toBeInTheDocument()
        // The status also appears as a filter option, so assert on the row cell specifically.
        expect(screen.getByRole('cell', { name: 'Pending Approval' }))
            .toBeInTheDocument()
    })

    it('applies administrator filters to the query', async () => {
        const user = userEvent.setup()
        mockGetEngagements.mockResolvedValue(response(
            [row({ viewerRole: TimesheetViewerRole.ADMINISTRATOR })],
            TimesheetViewerRole.ADMINISTRATOR,
        ))

        render(<TimesheetEngagementsPage />)

        await user.type(await screen.findByLabelText('Engagement title'), 'Frontend')
        await user.type(screen.getByLabelText('Assignee'), 'johnsmith')
        await user.type(screen.getByLabelText('Manager'), 'maryj')
        await user.selectOptions(screen.getByLabelText('Timesheet status'), 'Pending Approval')
        await user.click(screen.getByRole('button', { name: 'Apply' }))

        await waitFor(() => {
            expect(mockGetEngagements)
                .toHaveBeenLastCalledWith(expect.objectContaining({
                    assignee: 'johnsmith',
                    manager: 'maryj',
                    status: 'Pending Approval',
                    title: 'Frontend',
                }))
        })
    })

    it('opens the nested timesheet route from View', async () => {
        const user = userEvent.setup()
        mockGetEngagements.mockResolvedValue(response([row()], TimesheetViewerRole.MANAGER))

        render(<TimesheetEngagementsPage />)

        await user.click(await screen.findByRole('button', { name: 'View' }))

        expect(mockNavigate)
            .toHaveBeenCalledWith('/engagements/eng-1/timesheets/asg-1')
    })

    it('tells a manager with no approval authority that the list is empty', async () => {
        mockGetEngagements.mockResolvedValue(response([], TimesheetViewerRole.MANAGER))

        render(<TimesheetEngagementsPage />)

        expect(await screen.findByText(
            'You have no engagements with timesheet approval authority.',
        ))
            .toBeInTheDocument()
    })

    it('tells an administrator when filters match nothing', async () => {
        mockGetEngagements.mockResolvedValue(response([], TimesheetViewerRole.ADMINISTRATOR))

        render(<TimesheetEngagementsPage />)

        expect(await screen.findByText('No timesheets match these filters.'))
            .toBeInTheDocument()
    })

    it('paginates when there is more than one page', async () => {
        const user = userEvent.setup()
        mockGetEngagements.mockResolvedValue(response(
            [row({ viewerRole: TimesheetViewerRole.ADMINISTRATOR })],
            TimesheetViewerRole.ADMINISTRATOR,
            3,
        ))

        render(<TimesheetEngagementsPage />)

        expect(await screen.findByText('Page 1 of 3 (1 rows)'))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Previous' }))
            .toBeDisabled()

        await user.click(screen.getByRole('button', { name: 'Next' }))

        await waitFor(() => {
            expect(mockGetEngagements)
                .toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
        })
    })

    it('reports a load failure', async () => {
        mockGetEngagements.mockRejectedValue(new Error('boom'))

        render(<TimesheetEngagementsPage />)

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Failed to load timesheets. Please try again.')
    })
})
