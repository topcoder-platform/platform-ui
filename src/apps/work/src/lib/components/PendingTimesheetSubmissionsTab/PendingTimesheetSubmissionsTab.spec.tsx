/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import { PendingSubmissionTimesheetRow } from '../../models'
import { useFetchPendingSubmissionTimesheets } from '../../hooks'
import { sendPendingSubmissionReminders } from '../../services'
import {
    showErrorToast,
    showInfoToast,
    showSuccessToast,
} from '../../utils/toast.utils'

import { PendingTimesheetSubmissionsTab } from './PendingTimesheetSubmissionsTab'

jest.mock('~/libs/ui', () => ({
    Button: (props: { disabled?: boolean, label: string, onClick?: () => void }) => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>{props.label}</button>
    ),
    IconOutline: {
        ExternalLinkIcon: () => <></>,
    },
    // Shows the picked day, and reports a change only for a complete YYYY-MM-DD value or a clear.
    InputDatePicker: (props: {
        date?: Date
        label: string
        onChange: (date: Date | null) => void
    }) => (
        <input
            aria-label={props.label}
            data-date={props.date
                ? `${props.date.getFullYear()}-${props.date.getMonth() + 1}-${props.date.getDate()}`
                : ''}
            onChange={event => {
                if (!event.target.value) {
                    props.onChange(null)
                    return
                }

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
    ENGAGEMENTS_APP_URL: 'https://engagements.test',
    PAGE_SIZE: 10,
}))
jest.mock('../../hooks', () => ({
    useFetchPendingSubmissionTimesheets: jest.fn(),
}))
jest.mock('../../services', () => ({
    sendPendingSubmissionReminders: jest.fn(),
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

const mockedUseFetch = useFetchPendingSubmissionTimesheets as jest.MockedFunction<
    typeof useFetchPendingSubmissionTimesheets
>
const mockedSendReminders = sendPendingSubmissionReminders as jest.MockedFunction<
    typeof sendPendingSubmissionReminders
>

function buildRow(overrides: Partial<PendingSubmissionTimesheetRow> = {}): PendingSubmissionTimesheetRow {
    return {
        approvers: [{ handle: 'maryj', name: 'Mary Jones', userId: '2002' }],
        assigneeHandle: 'johnsmith',
        assigneeId: '1001',
        assignmentId: 'asg1',
        engagementId: 'eng1',
        engagementTitle: 'Senior Frontend Engineer',
        id: 'asg1',
        projectId: '100',
        workPeriodEnd: '2026-11-13',
        workPeriodStart: '2026-11-09',
        ...overrides,
    }
}

describe('PendingTimesheetSubmissionsTab', () => {
    const mutate = jest.fn()
    const rows = [
        buildRow(),
        buildRow({
            approvers: [],
            assigneeHandle: 'janedoe',
            assigneeId: '1002',
            assignmentId: 'asg2',
            engagementTitle: 'Data Engineer',
            id: 'asg2',
            workPeriodStart: '2026-11-11',
        }),
        buildRow({
            assignmentId: 'asg3',
            engagementTitle: 'Designer',
            id: 'asg3',
        }),
    ]

    beforeEach(() => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date(2026, 10, 18, 12))
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

    afterEach(() => {
        jest.useRealTimers()
    })

    it('opens on the previous working week', () => {
        render(<PendingTimesheetSubmissionsTab />)

        expect(mockedUseFetch)
            .toHaveBeenLastCalledWith(
                {
                    engagement: undefined,
                    excludeTestProjects: false,
                    fromDate: '2026-11-09',
                    page: 1,
                    perPage: 10,
                    toDate: '2026-11-13',
                },
                true,
            )
        expect(screen.getByLabelText('Work period from')
            .getAttribute('data-date'))
            .toBe('2026-11-9')
        expect(screen.getByLabelText('Work period to')
            .getAttribute('data-date'))
            .toBe('2026-11-13')
    })

    it('lists engagement, assignee, work period, and approvers', () => {
        render(<PendingTimesheetSubmissionsTab />)

        expect(screen.getByText('Data Engineer'))
            .toBeTruthy()
        expect(screen.getByText('janedoe'))
            .toBeTruthy()
        expect(screen.getByText('Nov 11, 2026 - Nov 13, 2026'))
            .toBeTruthy()
        expect(screen.getAllByText('Mary Jones (maryj)'))
            .toHaveLength(2)
        expect(screen.getByText('No manager assigned'))
            .toBeTruthy()
        expect(screen.getByText('Pagination: 3'))
            .toBeTruthy()
    })

    it('links the engagement name to the assignee timesheet in a new tab', () => {
        render(<PendingTimesheetSubmissionsTab />)

        const link = screen.getByRole('link', { name: 'Data Engineer' })

        expect(link.getAttribute('href'))
            .toBe('https://engagements.test/eng1/timesheets/asg2')
        expect(link.getAttribute('target'))
            .toBe('_blank')
        expect(link.getAttribute('rel'))
            .toBe('noreferrer noopener')
    })

    it('filters by engagement name and a picked work period', async () => {
        render(<PendingTimesheetSubmissionsTab excludeTestProjects />)

        fireEvent.change(screen.getByLabelText('Engagement name'), {
            target: { value: ' Frontend ' },
        })
        fireEvent.change(screen.getByLabelText('Work period from'), { target: { value: '2026-11-02' } })
        fireEvent.change(screen.getByLabelText('Work period to'), { target: { value: '2026-11-06' } })

        act(() => {
            jest.advanceTimersByTime(300)
        })

        await waitFor(() => {
            expect(mockedUseFetch)
                .toHaveBeenLastCalledWith(
                    {
                        engagement: 'Frontend',
                        excludeTestProjects: true,
                        fromDate: '2026-11-02',
                        page: 1,
                        perPage: 10,
                        toDate: '2026-11-06',
                    },
                    true,
                )
        })
    })

    it.each([
        ['2026-11-13', '2026-11-09', 'The to date cannot be earlier than the from date.'],
        ['2026-10-01', '2026-11-01', 'The work period cannot span more than 31 days.'],
        ['', '2026-11-13', 'Choose the work period to check, from and to.'],
    ])('does not request the period %p to %p', (fromDate, toDate, message) => {
        render(<PendingTimesheetSubmissionsTab />)

        fireEvent.change(screen.getByLabelText('Work period to'), { target: { value: toDate } })
        // The mock picker starts empty, so an empty value only reports a clear after something was typed.
        fireEvent.change(screen.getByLabelText('Work period from'), { target: { value: fromDate || '2026-11-02' } })
        fireEvent.change(screen.getByLabelText('Work period from'), { target: { value: fromDate } })

        expect(mockedUseFetch)
            .toHaveBeenLastCalledWith(expect.anything(), false)
        expect(screen.getByText(message))
            .toBeTruthy()
        expect(screen.getByRole('button', { name: 'Send Reminder' }))
            .toHaveProperty('disabled', true)
    })

    it('sends reminders for the selected assignments and work period and reports the result', async () => {
        mockedSendReminders.mockResolvedValue({
            recipients: [
                { assignmentId: 'asg1', handle: 'johnsmith', sent: true, userId: '1001' },
                { assignmentId: 'asg2', handle: 'janedoe', sent: false, userId: '1002' },
            ],
            sentCount: 1,
            skippedAssignmentIds: ['asg3'],
        })

        render(<PendingTimesheetSubmissionsTab />)

        fireEvent.click(screen.getByLabelText('Select all pending submissions on this page'))
        fireEvent.click(screen.getByRole('button', { name: 'Send Reminder' }))

        expect(screen.getByRole('dialog', { name: 'Send Submission Reminders' }).textContent)
            .toContain(
                'Send a reminder to submit timesheets for Nov 9, 2026 - Nov 13, 2026 to 2 members? '
                + 'Each selected assignment gets its own email (3 assignments).',
            )

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Confirm Send Reminder' }))
        })

        expect(mockedSendReminders)
            .toHaveBeenCalledWith(['asg1', 'asg2', 'asg3'], '2026-11-09', '2026-11-13')
        expect(showSuccessToast)
            .toHaveBeenCalledWith('Reminder sent to 1 member')
        expect(showErrorToast)
            .toHaveBeenCalledWith('Could not send a reminder to janedoe: no email address on file.')
        expect(showInfoToast)
            .toHaveBeenCalledWith(
                '1 selected timesheet submitted since the list was loaded, so no reminder was needed.',
            )
        expect(screen.queryByRole('dialog'))
            .toBeNull()
        expect(screen.getByText('0 selected'))
            .toBeTruthy()
        expect(mutate)
            .toHaveBeenCalled()
    })

    it('starts the selection over when the work period changes', () => {
        render(<PendingTimesheetSubmissionsTab />)

        fireEvent.click(screen.getByLabelText('Select janedoe on Data Engineer'))

        expect(screen.getByText('1 selected'))
            .toBeTruthy()

        fireEvent.change(screen.getByLabelText('Work period from'), { target: { value: '2026-11-02' } })

        expect(screen.getByText('0 selected'))
            .toBeTruthy()
    })

    it('keeps the selection when sending fails', async () => {
        mockedSendReminders.mockRejectedValue(new Error('Timesheet submission reminder emails are not configured.'))

        render(<PendingTimesheetSubmissionsTab />)

        fireEvent.click(screen.getByLabelText('Select janedoe on Data Engineer'))
        fireEvent.click(screen.getByRole('button', { name: 'Send Reminder' }))

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Confirm Send Reminder' }))
        })

        expect(showErrorToast)
            .toHaveBeenCalledWith('Timesheet submission reminder emails are not configured.')
        expect(screen.getByText('1 selected'))
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

        render(<PendingTimesheetSubmissionsTab />)

        expect(screen.getByText('Every active assignment has submitted a timesheet for this work period.'))
            .toBeTruthy()
    })
})
