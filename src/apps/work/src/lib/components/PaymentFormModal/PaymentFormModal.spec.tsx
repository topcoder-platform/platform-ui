/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'

import { ChangeEvent } from 'react'
import type { Assignment } from '../../models'

import { fetchTimesheetPaymentSummary, findTimesheetPaymentConflicts } from '../../services'

import PaymentFormModal from './PaymentFormModal'

interface MockDatePickerProps {
    onChange?: (date: Date | undefined) => void
    selected?: Date
}

/**
 * Stands in for react-datepicker. Reports a whole date at once, the way the real picker does, so the
 * modal's period-change effect fires exactly once per selection.
 */
const renderMockDatePicker = (props: unknown): JSX.Element => {
    const typedProps = props as MockDatePickerProps

    return (
        <input
            data-has-props={String(props !== undefined)}
            data-testid='payment-date-picker'
            onChange={function (event: ChangeEvent<HTMLInputElement>) {
                const [year, month, day] = event.target.value.split('-')
                    .map(Number)

                typedProps.onChange?.(
                    year && month && day ? new Date(year, month - 1, day) : undefined,
                )
            }}
            type='text'
            value={typedProps.selected
                ? [
                    typedProps.selected.getFullYear(),
                    String(typedProps.selected.getMonth() + 1)
                        .padStart(2, '0'),
                    String(typedProps.selected.getDate())
                        .padStart(2, '0'),
                ].join('-')
                : ''}
        />
    )
}

const mockDatePicker = jest.fn(renderMockDatePicker)

jest.mock('react-datepicker', () => ({
    __esModule: true,
    default: (props: unknown): JSX.Element => mockDatePicker(props),
}))

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: {
        buttons?: JSX.Element
        children: JSX.Element
        open: boolean
    }): JSX.Element => (
        props.open ? (
            <div>
                {props.children}
                {props.buttons}
            </div>
        ) : <></>
    ),
    Button: (props: {
        disabled?: boolean
        label: string
        onClick: () => void
    }): JSX.Element => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})

jest.mock('../../utils', () => ({
    calculatePaymentAmount: jest.fn(() => 821.2),
    getAssignmentPaymentCycle: jest.fn(() => 'WEEKLY'),
    getAssignmentRatePerHour: jest.fn(() => 20.53),
    getAssignmentStandardHoursPerDay: jest.fn(() => 8),
    getAssignmentStandardHoursPerWeek: jest.fn(() => 40),
    getExpectedHoursLabel: jest.fn(() => '40 hours per week'),
}))

jest.mock('../../services', () => ({
    fetchTimesheetPaymentSummary: jest.fn(),
    findTimesheetPaymentConflicts: jest.fn(),
}))

const mockFetchSummary = fetchTimesheetPaymentSummary as jest.MockedFunction<
    typeof fetchTimesheetPaymentSummary
>
const mockFindConflicts = findTimesheetPaymentConflicts as jest.MockedFunction<
    typeof findTimesheetPaymentConflicts
>

jest.mock('../../constants', () => ({
    BILLING_ACCOUNT_MEMBER_PAYMENT_DETAILS_ENABLED: true,
}))

describe('PaymentFormModal', () => {
    const member: Assignment = {
        agreementRate: '821.20',
        endDate: '2026-12-31T00:00:00.000Z',
        engagementId: 'engagement-1',
        id: 'assignment-1',
        memberHandle: 'testaws1',
        memberId: 12345,
        otherRemarks: '',
        ratePerHour: '20.53',
        standardHoursPerWeek: 40,
        startDate: '2026-04-01T00:00:00.000Z',
        status: 'ACTIVE',
        termsAccepted: true,
    }

    beforeEach(() => {
        mockDatePicker.mockClear()
        // The test setup resets mock implementations between tests, so put these back.
        mockDatePicker.mockImplementation(renderMockDatePicker)
        mockFindConflicts.mockResolvedValue({ conflicts: [], overlappingEntryIds: [] })
    })

    it('prevents the week ending calendar from opening on initial focus', () => {
        render(
            <PaymentFormModal
                engagementName='Engagement'
                member={member}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                open
                projectName='Project'
            />,
        )

        expect(mockDatePicker)
            .toHaveBeenCalledWith(expect.objectContaining({
                preventOpenOnFocus: true,
            }))
    })

    it('shows expected, approved, and paid hours for the picked period instead of approved days', async () => {
        mockFetchSummary.mockResolvedValue({
            alreadyPaidEntryIds: ['paid-1'],
            approvedHours: '40.00',
            entryIds: ['e1', 'e2', 'e3', 'e4'],
            expectedHours: '48.00',
            paidHours: '8.00',
            ratePerHour: '20.53',
            totalDays: 4,
            totalHours: '32.00',
        })

        render(
            <PaymentFormModal
                engagementId='engagement-1'
                engagementName='Engagement'
                member={member}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                open
                projectName='Project'
            />,
        )

        expect(screen.queryByText('Expected Hours'))
            .toBeNull()

        const [fromPicker, toPicker] = screen.getAllByTestId('payment-date-picker')
        fireEvent.change(fromPicker, { target: { value: '2026-09-01' } })
        fireEvent.change(toPicker, { target: { value: '2026-09-08' } })

        expect(await screen.findByText('Expected Hours'))
            .toBeTruthy()
        expect(screen.getByText('48.00'))
            .toBeTruthy()
        expect(screen.getByText('40.00'))
            .toBeTruthy()
        expect(screen.getByText('Paid Hours'))
            .toBeTruthy()
        expect(screen.getByText('8.00'))
            .toBeTruthy()
        expect(screen.queryByText(/approved days? in this period/))
            .toBeNull()
        // Paid Hours replaces the count of already-paid entries.
        expect(screen.queryByText(/already paid and (is|are) excluded/))
            .toBeNull()
        expect(mockFetchSummary)
            .toHaveBeenCalledWith('engagement-1', 'assignment-1', '2026-09-01', '2026-09-08')
    })

    it('says when the period has no approved timesheets', async () => {
        mockFetchSummary.mockResolvedValue({
            alreadyPaidEntryIds: [],
            approvedHours: '0.00',
            entryIds: [],
            // The API sends null when expected hours cannot be derived.
            // eslint-disable-next-line unicorn/no-null
            expectedHours: null,
            paidHours: '0.00',
            ratePerHour: '20.53',
            totalDays: 0,
            totalHours: '0.00',
        })

        render(
            <PaymentFormModal
                engagementId='engagement-1'
                engagementName='Engagement'
                member={member}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                open
                projectName='Project'
            />,
        )

        const [fromPicker, toPicker] = screen.getAllByTestId('payment-date-picker')
        fireEvent.change(fromPicker, { target: { value: '2026-09-01' } })
        fireEvent.change(toPicker, { target: { value: '2026-09-08' } })

        expect(await screen.findByText('No approved timesheets'))
            .toBeTruthy()
    })

    it('shows billing account id when enabled', () => {
        render(
            <PaymentFormModal
                billingAccountId={80001063}
                billingAccountMarkup={0.25}
                engagementName='Engagement'
                member={member}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                open
                projectName='Project'
            />,
        )

        expect(screen.getByText('Billing Account'))
            .toBeTruthy()
        expect(screen.getByText('80001063'))
            .toBeTruthy()
    })
})
