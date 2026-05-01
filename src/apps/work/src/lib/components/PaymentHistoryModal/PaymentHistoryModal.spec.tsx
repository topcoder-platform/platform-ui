/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
} from '@testing-library/react'

import PaymentHistoryModal from './PaymentHistoryModal'

const mockUseFetchAssignmentPayments = jest.fn()

jest.mock('../../hooks', () => ({
    useFetchAssignmentPayments: (...args: unknown[]): unknown => mockUseFetchAssignmentPayments(...args),
}))

jest.mock('../../constants', () => ({
    BILLING_ACCOUNT_MEMBER_PAYMENT_DETAILS_ENABLED: false,
}))

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: {
        buttons?: JSX.Element
        children: JSX.Element
        open: boolean
        title: string
    }): JSX.Element => (
        props.open ? (
            <div>
                <h1>{props.title}</h1>
                {props.children}
                {props.buttons}
            </div>
        ) : <></>
    ),
    Button: (props: {
        label: string
        onClick: () => void
    }): JSX.Element => (
        <button onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})

describe('PaymentHistoryModal', () => {
    beforeEach(() => {
        mockUseFetchAssignmentPayments.mockReset()
    })

    it('renders clickable remarks links and the payment creator handle', async () => {
        mockUseFetchAssignmentPayments.mockReturnValue({
            error: undefined,
            isLoading: false,
            isValidating: false,
            mutate: jest.fn(),
            payments: [
                {
                    amount: 120,
                    attributes: {
                        remarks: 'Support ticket: https://topcoder.zendesk.com/agent/tickets/141390.',
                    },
                    createdAt: '2026-03-31T00:00:00.000Z',
                    createdByHandle: 'payment.manager',
                    details: [
                        {
                            challengeFee: 18.6,
                            grossAmount: 120,
                            totalAmount: 120,
                        },
                    ],
                    id: 'payment-1',
                    title: 'Salesforce support',
                },
            ],
        })

        render(
            <PaymentHistoryModal
                assignmentId='assignment-1'
                memberHandle='salesforce'
                onClose={jest.fn()}
                open
            />,
        )

        const remarksLink = await screen.findByRole('link', {
            name: 'https://topcoder.zendesk.com/agent/tickets/141390',
        })

        expect(remarksLink.getAttribute('href'))
            .toBe('https://topcoder.zendesk.com/agent/tickets/141390')
        expect(remarksLink.getAttribute('target'))
            .toBe('_blank')
        expect(screen.getByText('Payment Creator:'))
            .toBeTruthy()
        expect(screen.getByText('payment.manager'))
            .toBeTruthy()
        expect(screen.queryByText('Fee:'))
            .toBeNull()
        expect(screen.queryByText('$18.60'))
            .toBeNull()
    })
})
