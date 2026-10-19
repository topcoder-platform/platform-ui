/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import { ApprovedTimesheetRow } from '../../models'
import { useFetchApprovedTimesheets } from '../../hooks'
import { createApprovedTimesheetPayments } from '../../services/approved-timesheet-payments.service'

import { ApprovedTimesheetsTab } from './ApprovedTimesheetsTab'

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: {
        buttons: JSX.Element
        children: JSX.Element
        open: boolean
        title: string
    }) => (props.open
        ? (
            <div role='dialog' aria-label={props.title}>
                {props.children}
                {props.buttons}
            </div>
        )
        : <></>),
    Button: (props: { disabled?: boolean, label: string, onClick?: () => void }) => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>{props.label}</button>
    ),
    IconOutline: {
        SearchIcon: () => <span>search-icon</span>,
    },
}), {
    virtual: true,
})
jest.mock('../../constants', () => ({
    PAGE_SIZE: 10,
}))
jest.mock('../../hooks', () => ({
    useFetchApprovedTimesheets: jest.fn(),
}))
jest.mock('../../services/approved-timesheet-payments.service', () => ({
    createApprovedTimesheetPayments: jest.fn(),
}))
jest.mock('../../utils/toast.utils', () => ({
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))
jest.mock('../ErrorMessage', () => ({
    ErrorMessage: (props: { message: string }) => <div>{props.message}</div>,
}))
jest.mock('../LoadingSpinner', () => ({
    LoadingSpinner: () => <div>Loading</div>,
}))
jest.mock('../Pagination', () => ({
    Pagination: (props: { total: number }) => <div>{`Pagination: ${props.total}`}</div>,
}))

const mockedUseFetch = useFetchApprovedTimesheets as jest.MockedFunction<typeof useFetchApprovedTimesheets>
const mockedCreatePayments = createApprovedTimesheetPayments as jest.MockedFunction<
    typeof createApprovedTimesheetPayments
>

function buildRow(overrides: Partial<ApprovedTimesheetRow> = {}): ApprovedTimesheetRow {
    return {
        agreementRate: '2000',
        approvalComment: 'Looks good',
        approvedAt: '2026-10-10T10:00:00.000Z',
        approvedBy: '2002',
        approvedByHandle: 'maryj',
        approvedByName: 'Mary Jones',
        assigneeHandle: 'johnsmith',
        assigneeId: '1001',
        assignmentId: 'asg1',
        engagementId: 'eng1',
        engagementTitle: 'Senior Frontend Engineer',
        entryIds: ['entry1'],
        hours: 8,
        hoursLeft: 120,
        id: 'row-1',
        paymentCycle: 'WEEKLY',
        projectId: '100',
        projectName: 'Acme Portal',
        ratePerHour: '50',
        standardHoursPerDay: 8,
        standardHoursPerWeek: null,
        workPeriodEnd: '2026-10-09',
        workPeriodStart: '2026-10-05',
        ...overrides,
    }
}

describe('ApprovedTimesheetsTab', () => {
    const mutate = jest.fn()
    const rows = [
        buildRow(),
        buildRow({
            approvalComment: null,
            approvedByName: null,
            assigneeHandle: 'janedoe',
            engagementTitle: 'Data Engineer',
            hoursLeft: null,
            id: 'row-2',
        }),
    ]

    beforeEach(() => {
        jest.clearAllMocks()
        mutate.mockResolvedValue(undefined)
        mockedUseFetch.mockReturnValue({
            error: undefined,
            isLoading: false,
            meta: { page: 1, perPage: 10, totalCount: 2, totalPages: 1 },
            mutate,
            rows,
        } as never)
    })

    it('shows the read-only approval fields', () => {
        render(<ApprovedTimesheetsTab />)

        expect(screen.getByText('Senior Frontend Engineer'))
            .toBeTruthy()
        expect(screen.getByText('johnsmith'))
            .toBeTruthy()
        expect(screen.getByText('120'))
            .toBeTruthy()
        expect(screen.getAllByText('Oct 5, 2026 - Oct 9, 2026'))
            .toHaveLength(2)
        expect(screen.getByText('Mary Jones (maryj)'))
            .toBeTruthy()
        // Without a resolved name the approver falls back to the handle alone.
        expect(screen.getByText('maryj'))
            .toBeTruthy()
        expect(screen.getByText('Looks good'))
            .toBeTruthy()
    })

    it('sends the engagement and assignee filters to the API', async () => {
        render(<ApprovedTimesheetsTab />)

        fireEvent.change(screen.getByLabelText('Search approved timesheets by engagement name'), {
            target: { value: 'Data' },
        })
        fireEvent.change(screen.getByLabelText('Search approved timesheets by assigned member'), {
            target: { value: 'jane' },
        })

        await waitFor(() => expect(mockedUseFetch)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                assignee: 'jane',
                engagement: 'Data',
                page: 1,
            })))
    })

    it('disables Pay until a timesheet is selected', () => {
        render(<ApprovedTimesheetsTab />)

        expect((screen.getByText('Pay') as HTMLButtonElement).disabled)
            .toBe(true)

        fireEvent.click(screen.getByLabelText('Select all approved timesheets on this page'))

        expect(screen.getByText('2 selected'))
            .toBeTruthy()
        expect((screen.getByText('Pay') as HTMLButtonElement).disabled)
            .toBe(false)
    })

    it('creates payments for the selected timesheets with the remarks', async () => {
        mockedCreatePayments.mockResolvedValue([
            { paymentReference: 'win-1', row: rows[0], status: 'paid' },
        ])

        render(<ApprovedTimesheetsTab />)

        fireEvent.click(screen.getByLabelText('Select johnsmith Oct 5, 2026 - Oct 9, 2026'))
        fireEvent.click(screen.getByText('Pay'))

        expect(screen.getByText(
            'Add your remark and proceed to create payments for the selected timesheets',
        ))
            .toBeTruthy()

        fireEvent.change(screen.getByLabelText('Remarks (optional)'), {
            target: { value: 'Invoice https://example.com/1' },
        })

        await act(async () => {
            fireEvent.click(screen.getByText('Create Payments'))
        })

        expect(mockedCreatePayments)
            .toHaveBeenCalledWith([rows[0]], 'Invoice https://example.com/1')
        expect(mutate)
            .toHaveBeenCalled()
        expect(screen.getByText('0 selected'))
            .toBeTruthy()
    })
})
