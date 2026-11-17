/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import { PendingApprovalTimesheetRow } from '../../models'
import { useFetchPendingApprovalTimesheets } from '../../hooks'
import { sendPendingApprovalReminders } from '../../services'
import {
    showErrorToast,
    showInfoToast,
    showSuccessToast,
} from '../../utils/toast.utils'

import { PendingTimesheetApprovalsTab } from './PendingTimesheetApprovalsTab'

jest.mock('~/libs/ui', () => ({
    Button: (props: { disabled?: boolean, label: string, onClick?: () => void }) => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>{props.label}</button>
    ),
    // Only a complete YYYY-MM-DD value reports a change, the way the real picker reports a whole date.
    InputDatePicker: (props: { label: string, onChange: (date: Date | null) => void }) => (
        <input
            aria-label={props.label}
            onChange={event => {
                const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(event.target.value)

                if (match) {
                    props.onChange(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
                }
            }}
            type='text'
        />
    ),
    InputText: (props: {
        label: string
        name: string
        onChange: (event: { target: { value: string } }) => void
        value?: string
    }) => (
        <label>
            <span>{props.label}</span>
            <input aria-label={props.label} name={props.name} onChange={props.onChange} value={props.value} />
        </label>
    ),
}), {
    virtual: true,
})
jest.mock('../../constants', () => ({
    PAGE_SIZE: 10,
}))
jest.mock('../../hooks', () => ({
    useFetchPendingApprovalTimesheets: jest.fn(),
}))
jest.mock('../../services', () => ({
    sendPendingApprovalReminders: jest.fn(),
}))
jest.mock('../../utils/toast.utils', () => ({
    showErrorToast: jest.fn(),
    showInfoToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))
jest.mock('../ConfirmationModal', () => ({
    ConfirmationModal: (props: {
        confirmText: string
        message: string
        onCancel: () => void
        onConfirm: () => void
        title: string
    }) => (
        <div role='dialog' aria-label={props.title}>
            <p>{props.message}</p>
            <button onClick={props.onConfirm} type='button'>{`Confirm ${props.confirmText}`}</button>
            <button onClick={props.onCancel} type='button'>Cancel</button>
        </div>
    ),
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

const mockedUseFetch = useFetchPendingApprovalTimesheets as jest.MockedFunction<
    typeof useFetchPendingApprovalTimesheets
>
const mockedSendReminders = sendPendingApprovalReminders as jest.MockedFunction<
    typeof sendPendingApprovalReminders
>

function buildRow(overrides: Partial<PendingApprovalTimesheetRow> = {}): PendingApprovalTimesheetRow {
    return {
        approvers: [
            { handle: 'maryj', name: 'Mary Jones', userId: '2002' },
            { handle: 'petek', name: null, userId: '2003' },
        ],
        assigneeHandle: 'johnsmith',
        assigneeId: '1001',
        assignmentId: 'asg1',
        engagementId: 'eng1',
        engagementTitle: 'Senior Frontend Engineer',
        entryIds: ['entry1'],
        hours: 8,
        id: 'row-1',
        projectId: '100',
        submittedAt: '2026-10-10T10:00:00.000Z',
        workPeriodEnd: '2026-10-09',
        workPeriodStart: '2026-10-05',
        ...overrides,
    }
}

describe('PendingTimesheetApprovalsTab', () => {
    const mutate = jest.fn()
    const rows = [
        buildRow(),
        buildRow({
            approvers: [],
            assigneeHandle: 'janedoe',
            assignmentId: 'asg2',
            engagementTitle: 'Data Engineer',
            id: 'row-2',
        }),
        buildRow({
            id: 'row-3',
            submittedAt: '2026-10-17T10:00:00.000Z',
            workPeriodEnd: '2026-10-16',
            workPeriodStart: '2026-10-12',
        }),
    ]

    beforeEach(() => {
        jest.clearAllMocks()
        mutate.mockResolvedValue(undefined)
        mockedUseFetch.mockReturnValue({
            error: undefined,
            isLoading: false,
            meta: { page: 1, perPage: 10, totalCount: 3, totalPages: 1 },
            mutate,
            rows,
        })
    })

    it('lists engagement, assignee, work period, submitted date, and approvers', () => {
        render(<PendingTimesheetApprovalsTab />)

        expect(screen.getAllByText('Senior Frontend Engineer'))
            .toHaveLength(2)
        expect(screen.getByText('janedoe'))
            .toBeTruthy()
        expect(screen.getAllByText('Oct 5, 2026 - Oct 9, 2026'))
            .toHaveLength(2)
        expect(screen.getByText('Oct 12, 2026 - Oct 16, 2026'))
            .toBeTruthy()
        expect(screen.getByText('Oct 17, 2026'))
            .toBeTruthy()
        expect(screen.getAllByText('Mary Jones (maryj), petek'))
            .toHaveLength(2)
        expect(screen.getByText('No manager assigned'))
            .toBeTruthy()
        expect(screen.getByText('Pagination: 3'))
            .toBeTruthy()
    })

    it('filters by engagement name and work period', async () => {
        render(<PendingTimesheetApprovalsTab excludeTestProjects />)

        fireEvent.change(screen.getByLabelText('Engagement name'), {
            target: { value: ' Frontend ' },
        })
        fireEvent.change(screen.getByLabelText('Work period from'), { target: { value: '2026-10-01' } })
        fireEvent.change(screen.getByLabelText('Work period to'), { target: { value: '2026-10-31' } })

        await waitFor(() => {
            expect(mockedUseFetch)
                .toHaveBeenLastCalledWith(
                    {
                        engagement: 'Frontend',
                        excludeTestProjects: true,
                        fromDate: '2026-10-01',
                        page: 1,
                        perPage: 10,
                        toDate: '2026-10-31',
                    },
                    true,
                )
        })
    })

    it('does not request an inverted work period', () => {
        render(<PendingTimesheetApprovalsTab />)

        fireEvent.change(screen.getByLabelText('Work period from'), { target: { value: '2026-10-31' } })
        fireEvent.change(screen.getByLabelText('Work period to'), { target: { value: '2026-10-01' } })

        expect(mockedUseFetch)
            .toHaveBeenLastCalledWith(expect.anything(), false)
        expect(screen.getByText('The to date cannot be earlier than the from date.'))
            .toBeTruthy()
    })

    it('sends one reminder request for the selected assignments and reports the result', async () => {
        mockedSendReminders.mockResolvedValue({
            engagementsWithoutManagers: [{ engagementId: 'eng2', engagementTitle: 'Data Engineer' }],
            recipients: [
                { handle: 'maryj', sent: true, userId: '2002' },
                { handle: 'petek', sent: false, userId: '2003' },
            ],
            sentCount: 1,
            skippedAssignmentIds: [],
        })

        render(<PendingTimesheetApprovalsTab />)

        expect(screen.getByRole('button', { name: 'Send Reminder' }))
            .toHaveProperty('disabled', true)

        fireEvent.click(screen.getByLabelText('Select all pending timesheets on this page'))

        expect(screen.getByText('3 selected'))
            .toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Send Reminder' }))

        expect(screen.getByRole('dialog', { name: 'Send Approval Reminders' }).textContent)
            .toContain('3 selected timesheets? Each assigned manager gets one email (2 managers).')

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Confirm Send Reminder' }))
        })

        // Two rows share an assignment, so it is only named once.
        expect(mockedSendReminders)
            .toHaveBeenCalledWith(['asg1', 'asg2'])
        expect(showSuccessToast)
            .toHaveBeenCalledWith('Reminder sent to 1 manager')
        expect(showErrorToast)
            .toHaveBeenCalledWith('Could not send a reminder to petek.')
        expect(showErrorToast)
            .toHaveBeenCalledWith(
                'No manager is assigned to Data Engineer, so nobody was reminded about it.',
            )
        expect(screen.queryByRole('dialog'))
            .toBeNull()
        expect(screen.getByText('0 selected'))
            .toBeTruthy()
        expect(mutate)
            .toHaveBeenCalled()
    })

    it('tells the administrator when selected timesheets no longer need a reminder', async () => {
        mockedSendReminders.mockResolvedValue({
            engagementsWithoutManagers: [],
            recipients: [],
            sentCount: 0,
            skippedAssignmentIds: ['asg2'],
        })

        render(<PendingTimesheetApprovalsTab />)

        fireEvent.click(screen.getByLabelText('Select janedoe Oct 5, 2026 - Oct 9, 2026'))
        fireEvent.click(screen.getByRole('button', { name: 'Send Reminder' }))

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Confirm Send Reminder' }))
        })

        expect(mockedSendReminders)
            .toHaveBeenCalledWith(['asg2'])
        expect(showInfoToast)
            .toHaveBeenCalledWith(
                '1 selected timesheet no longer awaiting approval, so no reminder was needed.',
            )
    })

    it('keeps the selection when sending fails', async () => {
        mockedSendReminders.mockRejectedValue(new Error('Timesheet approval reminder emails are not configured.'))

        render(<PendingTimesheetApprovalsTab />)

        fireEvent.click(screen.getByLabelText('Select janedoe Oct 5, 2026 - Oct 9, 2026'))
        fireEvent.click(screen.getByRole('button', { name: 'Send Reminder' }))

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Confirm Send Reminder' }))
        })

        expect(showErrorToast)
            .toHaveBeenCalledWith('Timesheet approval reminder emails are not configured.')
        expect(screen.getByText('1 selected'))
            .toBeTruthy()
        expect(screen.getByRole('dialog', { name: 'Send Approval Reminders' }))
            .toBeTruthy()
    })

    it('shows an empty state', () => {
        mockedUseFetch.mockReturnValue({
            error: undefined,
            isLoading: false,
            meta: { page: 1, perPage: 10, totalCount: 0, totalPages: 0 },
            mutate,
            rows: [],
        })

        render(<PendingTimesheetApprovalsTab />)

        expect(screen.getByText('No timesheets are pending approval.'))
            .toBeTruthy()
    })
})
