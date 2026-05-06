/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
} from '@testing-library/react'

import type { Assignment } from '../../models'

import PaymentFormModal from './PaymentFormModal'

const mockDatePicker = jest.fn((props: unknown) => (
    <div
        data-has-props={String(props !== undefined)}
        data-testid='payment-week-ending-picker'
    />
))

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
    getAssignmentRatePerHour: jest.fn(() => 20.53),
    getAssignmentStandardHoursPerWeek: jest.fn(() => 40),
}))

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
