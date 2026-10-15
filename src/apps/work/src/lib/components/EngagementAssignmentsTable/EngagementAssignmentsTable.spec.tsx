/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import {
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import {
    EngagementAssignmentRow,
    EngagementAssignmentsTable,
} from './EngagementAssignmentsTable'

jest.mock('react-select', () => ({
    __esModule: true,
    default: (props: {
        inputId: string
        onChange: (value: { label: string; value: string } | undefined) => void
        options: Array<{ label: string; value: string }>
        value?: { label: string; value: string }
    }) => (
        <select
            data-testid={props.inputId}
            onChange={event => props.onChange(
                props.options.find(option => option.value === event.target.value),
            )}
            value={props.value?.value}
        >
            {props.options.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    ),
}))
jest.mock('~/libs/ui', () => ({
    IconOutline: {
        ExternalLinkIcon: () => <span>external-link-icon</span>,
        SearchIcon: () => <span>search-icon</span>,
    },
}), {
    virtual: true,
})
jest.mock('../../../config/routes.config', () => ({
    rootRoute: '/work',
}))
jest.mock('../../constants', () => ({
    ENGAGEMENTS_APP_URL: 'https://engagements.example.com',
    PAGE_SIZE: 10,
}))
// The utils barrel reaches into platform libs; the table needs only the date and payment helpers.
jest.mock('../../utils', () => ({
    ...jest.requireActual('../../utils/date.utils'),
    ...jest.requireActual('../../utils/payment.utils'),
}))
jest.mock('../Pagination', () => ({
    Pagination: (props: { total: number }) => <div>{`Pagination: ${props.total}`}</div>,
}))

function buildRow(
    id: string,
    memberHandle: string,
    status: string,
    engagementTitle: string,
    projectName: string,
): EngagementAssignmentRow {
    return {
        assignment: {
            agreementRate: '',
            endDate: '2026-12-31T00:00:00.000Z',
            engagementId: `eng-${id}`,
            id,
            memberHandle,
            memberId: 1,
            otherRemarks: '',
            ratePerHour: '50',
            startDate: '2026-10-01T00:00:00.000Z',
            status,
            termsAccepted: true,
        },
        engagement: {
            id: `eng-${id}`,
            title: engagementTitle,
        } as EngagementAssignmentRow['engagement'],
        projectId: `p-${id}`,
        projectName,
    }
}

const rows: EngagementAssignmentRow[] = [
    buildRow('a1', 'first_member', 'ASSIGNED', 'React Developer', 'Payment Testing'),
    buildRow('a2', 'second_member', 'SELECTED', 'Data Engineer', 'API Rollout'),
    buildRow('a3', 'third_member', 'COMPLETED', 'React Reviewer', 'API Rollout'),
]

function renderTable(tableRows: EngagementAssignmentRow[] = rows): void {
    render(
        <MemoryRouter>
            <EngagementAssignmentsTable backUrl='/work/engagements?tab=assignments' rows={tableRows} />
        </MemoryRouter>,
    )
}

function getMemberHandles(): string[] {
    return screen.getAllByRole('row')
        .slice(1)
        .map(row => within(row)
            .getAllByRole('cell')[0].textContent || '')
}

describe('EngagementAssignmentsTable', () => {
    it('renders one row per assignment with its engagement and project', () => {
        renderTable()

        expect(getMemberHandles())
            .toEqual(['first_member', 'second_member', 'third_member'])

        const firstRow = screen.getAllByRole('row')[1]
        expect(within(firstRow)
            .getByRole('link', { name: 'Payment Testing' })
            .getAttribute('href'))
            .toBe('/work/projects/p-a1/challenges')
        expect(within(firstRow)
            .getByRole('link', { name: 'React Developer' })
            .getAttribute('href'))
            .toBe('/work/projects/p-a1/engagements/eng-a1/view')
        expect(within(firstRow)
            .getByRole('link', { name: 'Manage' })
            .getAttribute('href'))
            .toBe('/work/projects/p-a1/engagements/eng-a1/assignments')
        expect(within(firstRow)
            .getByText('Assigned'))
            .toBeTruthy()
        expect(screen.getByText('Pagination: 3'))
            .toBeTruthy()
    })

    it('links a timesheet only for assignments that can have one', () => {
        renderTable()

        const [, assignedRow, selectedRow] = screen.getAllByRole('row')

        expect(within(assignedRow)
            .getByRole('link', { name: /Timesheet/ })
            .getAttribute('href'))
            .toBe('https://engagements.example.com/eng-a1/timesheets/a1')
        expect(within(selectedRow)
            .queryByRole('link', { name: /Timesheet/ }))
            .toBeNull()
    })

    it('filters by assignment status', () => {
        renderTable()

        fireEvent.change(screen.getByTestId('work-assignments-status'), {
            target: { value: 'SELECTED' },
        })

        expect(getMemberHandles())
            .toEqual(['second_member'])
    })

    it('searches by project name', () => {
        renderTable()

        fireEvent.change(screen.getByLabelText('Search assignments by project name'), {
            target: { value: 'api roll' },
        })

        expect(getMemberHandles())
            .toEqual(['second_member', 'third_member'])
    })

    it('searches by engagement name', () => {
        renderTable()

        fireEvent.change(screen.getByLabelText('Search assignments by engagement name'), {
            target: { value: 'react' },
        })

        expect(getMemberHandles())
            .toEqual(['first_member', 'third_member'])
    })

    it('combines the filters', () => {
        renderTable()

        fireEvent.change(screen.getByLabelText('Search assignments by project name'), {
            target: { value: 'api' },
        })
        fireEvent.change(screen.getByLabelText('Search assignments by engagement name'), {
            target: { value: 'react' },
        })

        expect(getMemberHandles())
            .toEqual(['third_member'])
    })

    it('shows an empty state when nothing matches', () => {
        renderTable()

        fireEvent.change(screen.getByLabelText('Search assignments by engagement name'), {
            target: { value: 'nothing like this' },
        })

        expect(screen.getByText('No assignments found.'))
            .toBeTruthy()
        expect(screen.queryByText(/Pagination/))
            .toBeNull()
    })
})
