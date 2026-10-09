/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
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
    // Only a complete YYYY-MM-DD value reports a change, the way the real picker reports a whole date.
    InputDatePicker: (props: {
        label: string
        onChange: (date: Date | null) => void
    }) => (
        <label>
            <span>{props.label}</span>
            <input
                aria-label={props.label}
                onChange={function onPickerChange(event: React.ChangeEvent<HTMLInputElement>) {
                    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(event.target.value)

                    if (match) {
                        props.onChange(
                            new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
                        )
                    }
                }}
                type='text'
            />
        </label>
    ),
    InputSelect: (props: {
        label: string
        onChange?: React.ChangeEventHandler<HTMLSelectElement>
        options?: Array<{ label: string, value: string }>
        value?: string
    }) => (
        <label>
            <span>{props.label}</span>
            <select aria-label={props.label} value={props.value} onChange={props.onChange}>
                {props.options?.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </label>
    ),
    InputText: (props: {
        label: string
        onChange?: React.ChangeEventHandler<HTMLInputElement>
        value?: string
    }) => (
        <label>
            <span>{props.label}</span>
            <input aria-label={props.label} value={props.value} onChange={props.onChange} />
        </label>
    ),
    LoadingSpinner: () => <div>loading-spinner</div>,
}), { virtual: true })

const mockAuth = { isAdmin: false, isLoggedIn: true, isTm: false, userRoles: [] as string[] }

jest.mock('../../lib/utils/auth', () => ({
    useAuth: () => mockAuth,
}))

jest.mock('../../components', () => ({
    EngagementsTabs: (props: { activeTab: string }) => (
        <div data-testid='engagements-tabs' data-active-tab={props.activeTab} />
    ),
    // Mirrors the real badge's label: an explicit label, or the status in title case.
    StatusBadge: (props: { label?: string, status: string }) => (
        <span>
            {props.label
                ?? `${props.status.charAt(0)}${props.status.slice(1)
                    .toLowerCase()}`}
        </span>
    ),
}), { virtual: true })

jest.mock('react-markdown', () => ({
    __esModule: true,
    default: (props: { children?: React.ReactNode }) => <div>{props.children}</div>,
}), { virtual: true })

jest.mock('../../components/engagement-card', () => ({
    __esModule: true,
    default: () => <div />,
    EngagementCard: () => <div />,
}), { virtual: true })

jest.mock('../../components/engagement-filters', () => ({
    __esModule: true,
    default: () => <div />,
    EngagementFilters: () => <div />,
}), { virtual: true })

jest.mock('rehype-raw', () => ({
    __esModule: true,
    default: () => undefined,
}), { virtual: true })

jest.mock('remark-frontmatter', () => ({
    __esModule: true,
    default: () => undefined,
}), { virtual: true })

jest.mock('remark-gfm', () => ({
    __esModule: true,
    default: () => undefined,
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
    assignmentStatus: 'ASSIGNED',
    engagementId: 'eng-1',
    engagementTitle: 'Senior Frontend Engineer',
    hasPendingApproval: true,
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
        mockAuth.isAdmin = false
    })

    it('opens an administrator on All timesheets rather than Pending Approval', async () => {
        mockAuth.isAdmin = true
        mockGetEngagements.mockResolvedValue(response(
            [row({ viewerRole: TimesheetViewerRole.ADMINISTRATOR })],
            TimesheetViewerRole.ADMINISTRATOR,
        ))

        render(<TimesheetEngagementsPage />)

        await waitFor(() => {
            expect(mockGetEngagements)
                .toHaveBeenCalledWith(expect.objectContaining({ status: undefined }))
        })
        expect(mockGetEngagements).not.toHaveBeenCalledWith(
            expect.objectContaining({ status: 'Pending Approval' }),
        )
        expect(await screen.findByLabelText('Status'))
            .toHaveValue('')
    })

    it('keeps a manager on Pending Approval by default', async () => {
        mockGetEngagements.mockResolvedValue(response([row()], TimesheetViewerRole.MANAGER))

        render(<TimesheetEngagementsPage />)

        await waitFor(() => {
            expect(mockGetEngagements)
                .toHaveBeenCalledWith(expect.objectContaining({ status: 'Pending Approval' }))
        })
        expect(screen.queryByLabelText('From Date')).not.toBeInTheDocument()
    })

    it('filters an administrator list by date range', async () => {
        const user = userEvent.setup()
        mockAuth.isAdmin = true
        mockGetEngagements.mockResolvedValue(response(
            [row({ viewerRole: TimesheetViewerRole.ADMINISTRATOR })],
            TimesheetViewerRole.ADMINISTRATOR,
        ))

        render(<TimesheetEngagementsPage />)

        await user.type(await screen.findByLabelText('From Date'), '2026-01-01')
        await user.type(screen.getByLabelText('To Date'), '2026-09-30')

        await waitFor(() => {
            expect(mockGetEngagements)
                .toHaveBeenLastCalledWith(expect.objectContaining({
                    fromDate: '2026-01-01',
                    toDate: '2026-09-30',
                }))
        })
    })

    it('shows an inverted date range as an error and does not send it', async () => {
        const user = userEvent.setup()
        mockAuth.isAdmin = true
        mockGetEngagements.mockResolvedValue(response(
            [row({ viewerRole: TimesheetViewerRole.ADMINISTRATOR })],
            TimesheetViewerRole.ADMINISTRATOR,
        ))

        render(<TimesheetEngagementsPage />)

        await user.type(await screen.findByLabelText('From Date'), '2026-09-30')
        await user.type(screen.getByLabelText('To Date'), '2026-09-01')

        expect(await screen.findByText('The to date cannot be earlier than the from date.'))
            .toBeInTheDocument()
        expect(mockGetEngagements).not.toHaveBeenCalledWith(
            expect.objectContaining({ toDate: '2026-09-01' }),
        )
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

        expect(screen.getByLabelText('Engagement title'))
            .toBeInTheDocument()
        expect(screen.getByLabelText('Assignee'))
            .toBeInTheDocument()
        expect(screen.queryByLabelText('Manager'))
            .not
            .toBeInTheDocument()
        expect(screen.queryByRole('columnheader', { name: 'Timesheet Status' }))
            .not
            .toBeInTheDocument()
    })

    it('uses the TM empty state copy for the submitted-review list', async () => {
        mockGetEngagements.mockResolvedValue(response([], TimesheetViewerRole.TM))

        render(<TimesheetEngagementsPage />)

        expect(await screen.findByText('No submitted timesheets match these filters.'))
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
        expect(await screen.findByLabelText('Manager'))
            .toBeInTheDocument()
        expect(screen.getByLabelText('Status'))
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
        await user.type(await screen.findByLabelText('Manager'), 'maryj')
        await user.selectOptions(screen.getByLabelText('Status'), 'Pending Approval')

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

    it('shows a manager the assignee, engagement, assignment status, and pending flag', async () => {
        mockGetEngagements.mockResolvedValue(response([
            row(),
            row({
                assignmentId: 'asg-2',
                assignmentStatus: 'COMPLETED',
                hasPendingApproval: false,
                timesheetStatus: 'Approved',
            }),
        ], TimesheetViewerRole.MANAGER))

        render(<TimesheetEngagementsPage />)

        // Wait past the loading skeleton, which is a table too.
        await screen.findAllByText('John Smith (johnsmith)')
        const table = screen.getByRole('table')
        expect(within(table)
            .getAllByRole('columnheader')
            .map(header => header.textContent))
            .toEqual(['Assignee', 'Engagement', 'Assignment Status', 'Pending Approval', 'Action'])

        const [, assignedRow, completedRow] = within(table)
            .getAllByRole('row')
        expect(within(assignedRow)
            .getAllByRole('cell')
            .map(cell => cell.textContent))
            .toEqual([
                'John Smith (johnsmith)',
                'Senior Frontend Engineer',
                'Assigned',
                'Pending approval',
                'View',
            ])
        expect(within(completedRow)
            .getByText('Completed'))
            .toBeInTheDocument()
        expect(within(completedRow)
            .queryByText('Pending approval')).not.toBeInTheDocument()
    })

    it('keeps the timesheet status column for an administrator', async () => {
        mockGetEngagements.mockResolvedValue(response(
            [row({ viewerRole: TimesheetViewerRole.ADMINISTRATOR })],
            TimesheetViewerRole.ADMINISTRATOR,
        ))

        render(<TimesheetEngagementsPage />)

        // Wait past the loading skeleton, which is a table too.
        await screen.findAllByText('John Smith (johnsmith)')
        const table = screen.getByRole('table')
        expect(within(table)
            .getAllByRole('columnheader')
            .map(header => header.textContent))
            .toEqual(['Engagement Title', 'Assignee', 'Timesheet Status', 'Action'])
    })

    it('opens the nested timesheet route from View', async () => {
        const user = userEvent.setup()
        mockGetEngagements.mockResolvedValue(response([row()], TimesheetViewerRole.MANAGER))

        render(<TimesheetEngagementsPage />)

        await user.click(await screen.findByRole('button', { name: 'View' }))

        expect(mockNavigate)
            .toHaveBeenCalledWith('/engagements/eng-1/timesheets/asg-1?status=SUBMITTED')
    })

    it('opens the timesheet on Approved when the list was filtered to Approved', async () => {
        const user = userEvent.setup()
        mockGetEngagements.mockResolvedValue(response(
            [row({ timesheetStatus: 'Approved' })],
            TimesheetViewerRole.MANAGER,
        ))

        render(<TimesheetEngagementsPage />)

        await user.selectOptions(await screen.findByLabelText('Status'), 'Approved')
        await waitFor(() => {
            expect(mockGetEngagements)
                .toHaveBeenLastCalledWith(expect.objectContaining({ status: 'Approved' }))
        })
        await user.click(await screen.findByRole('button', { name: 'View' }))

        expect(mockNavigate)
            .toHaveBeenCalledWith('/engagements/eng-1/timesheets/asg-1?status=APPROVED')
    })

    it('follows the row status under All', async () => {
        const user = userEvent.setup()
        mockGetEngagements.mockResolvedValue(response(
            [row({ timesheetStatus: 'Approved' })],
            TimesheetViewerRole.MANAGER,
        ))

        render(<TimesheetEngagementsPage />)

        await user.selectOptions(await screen.findByLabelText('Status'), '')
        await waitFor(() => {
            expect(mockGetEngagements)
                .toHaveBeenLastCalledWith(expect.objectContaining({ status: undefined }))
        })
        await user.click(await screen.findByRole('button', { name: 'View' }))

        expect(mockNavigate)
            .toHaveBeenCalledWith('/engagements/eng-1/timesheets/asg-1?status=APPROVED')
    })

    it('tells a manager when nothing is pending approval', async () => {
        mockGetEngagements.mockResolvedValue(response([], TimesheetViewerRole.MANAGER))

        render(<TimesheetEngagementsPage />)

        expect(await screen.findByText('You have no timesheets in pending approval status.'))
            .toBeInTheDocument()
    })

    it('names the status a manager filtered by when nothing is approved', async () => {
        const user = userEvent.setup()
        mockGetEngagements.mockResolvedValue(response([], TimesheetViewerRole.MANAGER))

        render(<TimesheetEngagementsPage />)

        await screen.findByText('You have no timesheets in pending approval status.')
        await user.selectOptions(screen.getByLabelText('Status'), 'Approved')

        expect(await screen.findByText('You have no approved timesheets.'))
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
