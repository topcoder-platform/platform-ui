/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import React from 'react'
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import { editPayment, getMemberHandle, getPayments } from '../../../lib/services/wallet'
import PaymentsListView from './PaymentsListView'

const mockFilterBar = jest.fn((props: any) => (
    <div data-testid='filter-bar'>
        {props.selectedValueOverrides?.status ?? ''}
        {(props.selectionActions ?? []).map((action: any) => (
            <button key={action.key} type='button' onClick={action.onClick}>
                {action.label}
            </button>
        ))}
    </div>
))

jest.mock('../../../lib/services/wallet', () => ({
    editPayment: jest.fn(),
    exportSearchResults: jest.fn(),
    getMemberHandle: jest.fn(),
    getPayments: jest.fn(),
}))

jest.mock('../../../lib', () => ({
    FilterBar: (props: any) => mockFilterBar(props),
    formatIOSDateString: (value: string) => value,
    PaymentView: () => <div>Payment View</div>,
}))

jest.mock('../../../lib/components/payment-edit/PaymentEdit', () => ({
    __esModule: true,
    default: function PaymentEdit() {
        return <div>Payment Edit</div>
    },
}))

jest.mock('../../../lib/components/payments-table/PaymentTable', () => ({
    __esModule: true,
    default: function PaymentTable(props: any) {
        return (
            <div>
                <div>Payment Table</div>
                {props.payments.map((payment: any) => (
                    <button
                        key={payment.id}
                        type='button'
                        onClick={() => props.onSelectionChange?.({ [payment.id]: payment })}
                    >
                        Select
                        {' '}
                        {payment.handle}
                    </button>
                ))}
                {props.payments.length > 1 && (
                    <button
                        type='button'
                        onClick={() => props.onSelectionChange?.(
                            Object.fromEntries(
                                props.payments.map((payment: any) => [payment.id, payment]),
                            ),
                        )}
                    >
                        Select All Payments
                    </button>
                )}
            </div>
        )
    },
}))

jest.mock('~/libs/ui', () => ({
    Collapsible: (props: {
        children: React.ReactNode
        header: React.ReactNode
    }) => (
        <div>
            {props.header}
            {props.children}
        </div>
    ),
    ConfirmModal: (props: any) => (
        props.open
            ? (
                <div>
                    <h4>{props.title}</h4>
                    {props.children}
                    {props.showButtons !== false && (
                        <button
                            type='button'
                            onClick={props.onConfirm}
                            disabled={props.canSave === false}
                        >
                            {props.action ?? 'Confirm'}
                        </button>
                    )}
                </div>
            )
            : undefined
    ),
    InputText: (props: any) => (
        <input
            aria-label={props.label ?? props.name}
            name={props.name}
            value={props.value}
            onChange={props.onChange}
        />
    ),
    LoadingCircles: () => <div>Loading</div>,
}), { virtual: true })

jest.mock('~/libs/shared', () => ({
    downloadBlob: jest.fn(),
}), { virtual: true })

jest.mock('axios', () => ({
    AxiosError: class AxiosError extends Error {},
}))

const mockedGetPayments = getPayments as jest.MockedFunction<typeof getPayments>
const mockedGetMemberHandle = getMemberHandle as jest.MockedFunction<typeof getMemberHandle>
const mockedEditPayment = editPayment as jest.MockedFunction<typeof editPayment>

const emptyPaymentsResponse = {
    pagination: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    },
    winnings: [],
}

const paymentsResponse = {
    pagination: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 2,
        totalPages: 1,
    },
    winnings: [
        {
            attributes: {
                assignmentId: 'assignment-1',
            },
            category: 'ENGAGEMENT_PAYMENT',
            createdAt: '2026-04-02T00:00:00.000Z',
            datePaid: '',
            description: 'V6 project - test eng prj ch - Week Ending: Apr 04, 2026',
            details: [{
                currency: 'USD',
                datePaid: '',
                grossAmount: '2400',
                id: 'detail-1',
                installmentNumber: 1,
                status: 'ON_HOLD_ADMIN',
                totalAmount: '2400',
            }],
            externalId: 'engagement-1',
            handle: '',
            id: 'winning-1',
            origin: 'MANUAL',
            paymentStatus: {
                payoutSetupComplete: true,
                taxFormSetupComplete: true,
            },
            releaseDate: '2026-04-17T00:00:00.000Z',
            title: 'Winning 1',
            type: 'PAYMENT',
            winnerId: '111',
        },
        {
            attributes: {
                assignmentId: 'assignment-2',
            },
            category: 'ENGAGEMENT_PAYMENT',
            createdAt: '2026-04-01T00:00:00.000Z',
            datePaid: '',
            description: 'SK project1 - Test engagement tm - Week Ending: Apr 04, 2026',
            details: [{
                currency: 'USD',
                datePaid: '',
                grossAmount: '9600',
                id: 'detail-2',
                installmentNumber: 1,
                status: 'ON_HOLD_ADMIN',
                totalAmount: '9600',
            }],
            externalId: 'engagement-2',
            handle: '',
            id: 'winning-2',
            origin: 'MANUAL',
            paymentStatus: {
                payoutSetupComplete: true,
                taxFormSetupComplete: true,
            },
            releaseDate: '2026-04-17T00:00:00.000Z',
            title: 'Winning 2',
            type: 'PAYMENT',
            winnerId: '222',
        },
    ],
}

describe('PaymentsListView', () => {
    beforeEach(() => {
        mockFilterBar.mockClear()
        mockedGetPayments.mockResolvedValue(emptyPaymentsResponse)
        mockedGetMemberHandle.mockResolvedValue(new Map())
        mockedEditPayment.mockResolvedValue('Successfully updated winnings')
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('defaults the approver view to the On Hold (Admin) status filter and both allowed categories', async () => {
        render(
            <PaymentsListView
                profile={{ roles: ['Payment Approver'] } as any}
            />,
        )

        await screen.findByText('No payments match your filters.')

        expect(mockedGetPayments)
            .toHaveBeenLastCalledWith(10, 0, {
                categories: ['TASK_PAYMENT', 'ENGAGEMENT_PAYMENT'],
                date: ['last30days'],
                status: ['ON_HOLD_ADMIN'],
            })
        expect(mockFilterBar)
            .toHaveBeenCalled()
        expect(mockFilterBar.mock.calls.at(-1)?.[0].selectedValueOverrides)
            .toEqual(expect.objectContaining({
                status: 'ON_HOLD_ADMIN',
            }))
    })

    it('defaults the wipro taas admin view to TAAS scoped category filters', async () => {
        render(
            <PaymentsListView
                profile={{ roles: ['Wipro TaaS Admin'] } as any}
            />,
        )

        await screen.findByText('Member earnings will appear here.')

        expect(mockedGetPayments)
            .toHaveBeenLastCalledWith(10, 0, {
                category: ['TAAS_PAYMENT'],
            })
        expect(mockFilterBar.mock.calls.at(-1)?.[0].selectedValueOverrides)
            .toEqual(expect.objectContaining({
                category: 'TAAS_PAYMENT',
            }))
    })

    it('applies the default approver status after switching from admin view', async () => {
        render(
            <PaymentsListView
                profile={{ roles: ['Payment Admin', 'Payment Approver'] } as any}
            />,
        )

        await screen.findByText('Member earnings will appear here.')

        expect(mockedGetPayments)
            .toHaveBeenLastCalledWith(10, 0, {})

        fireEvent.click(screen.getByRole('button', { name: 'Approver View' }))

        await screen.findByText('No payments match your filters.')

        expect(mockedGetPayments)
            .toHaveBeenLastCalledWith(10, 0, {
                categories: ['TASK_PAYMENT', 'ENGAGEMENT_PAYMENT'],
                date: ['last30days'],
                status: ['ON_HOLD_ADMIN'],
            })

        expect(mockFilterBar.mock.calls.at(-1)?.[0].selectedValueOverrides)
            .toEqual(expect.objectContaining({
                status: 'ON_HOLD_ADMIN',
            }))
    })

    it('keeps payment admins with Wipro TaaS Admin access on the unrestricted admin view', async () => {
        render(
            <PaymentsListView
                profile={{ roles: ['Payment Admin', 'Wipro TaaS Admin'] } as any}
            />,
        )

        await screen.findByText('Member earnings will appear here.')

        expect(mockedGetPayments)
            .toHaveBeenLastCalledWith(10, 0, {})
        expect(mockFilterBar.mock.calls.at(-1)?.[0].selectedValueOverrides)
            .toEqual({
                category: 'all',
                date: 'all',
                status: 'all',
            })
    })

    it('lets an explicit status filter override the default approver status', async () => {
        render(
            <PaymentsListView
                profile={{ roles: ['Payment Approver'] } as any}
            />,
        )

        await screen.findByText('No payments match your filters.')

        await act(async () => {
            mockFilterBar.mock.calls.at(-1)?.[0].onFilterChange('status', ['PAID'])
        })

        await waitFor(() => {
            expect(mockedGetPayments)
                .toHaveBeenLastCalledWith(10, 0, {
                    categories: ['TASK_PAYMENT', 'ENGAGEMENT_PAYMENT'],
                    date: ['last30days'],
                    status: ['PAID'],
                })
        })

        expect(mockFilterBar.mock.calls.at(-1)?.[0].selectedValueOverrides)
            .toEqual(expect.objectContaining({
                status: 'PAID',
            }))
    })

    it('lets an explicit status filter apply within the wipro taas admin view', async () => {
        render(
            <PaymentsListView
                profile={{ roles: ['Wipro TaaS Admin'] } as any}
            />,
        )

        await screen.findByText('Member earnings will appear here.')

        await act(async () => {
            mockFilterBar.mock.calls.at(-1)?.[0].onFilterChange('status', ['PAID'])
        })

        await waitFor(() => {
            expect(mockedGetPayments)
                .toHaveBeenLastCalledWith(10, 0, {
                    category: ['TAAS_PAYMENT'],
                    status: ['PAID'],
                })
        })

        expect(mockFilterBar.mock.calls.at(-1)?.[0].selectedValueOverrides)
            .toEqual(expect.objectContaining({
                category: 'TAAS_PAYMENT',
                status: 'PAID',
            }))
    })

    it('lets approvers reject selected on hold admin payments with an audit note', async () => {
        mockedGetPayments.mockResolvedValue(paymentsResponse as any)
        mockedGetMemberHandle.mockResolvedValue(new Map([
            [111, 'sathya22in'],
            [222, 'liuliquan'],
        ]))

        render(
            <PaymentsListView
                profile={{ roles: ['Payment Approver'] } as any}
            />,
        )

        await screen.findByText('Payment Table')

        fireEvent.click(screen.getByRole('button', { name: 'Select All Payments' }))

        await waitFor(() => {
            expect(mockFilterBar.mock.calls.at(-1)?.[0].selectionActions.map((action: any) => action.label))
                .toEqual([
                    'Approve (2)',
                    'Reject (2)',
                ])
        })

        act(() => {
            mockFilterBar.mock.calls.at(-1)?.[0].selectionActions[1].onClick()
        })

        expect(screen.queryByText('Reject Payments'))
            .not.toBeNull()

        const confirmButton = screen.getByRole('button', { name: 'Reject' })
        expect(confirmButton.hasAttribute('disabled'))
            .toBe(true)

        fireEvent.change(screen.getByRole('textbox', { name: 'Audit Note' }), {
            target: { value: 'Reject these invalid engagement winnings.' },
        })

        expect(confirmButton.hasAttribute('disabled'))
            .toBe(false)

        fireEvent.click(confirmButton)

        await waitFor(() => {
            expect(mockedEditPayment)
                .toHaveBeenCalledTimes(2)
        })

        expect(mockedEditPayment)
            .toHaveBeenNthCalledWith(1, {
                auditNote: 'Reject these invalid engagement winnings.',
                paymentStatus: 'CANCELLED',
                winningsId: 'winning-1',
            })
        expect(mockedEditPayment)
            .toHaveBeenNthCalledWith(2, {
                auditNote: 'Reject these invalid engagement winnings.',
                paymentStatus: 'CANCELLED',
                winningsId: 'winning-2',
            })
    })

    it('includes the topgear payment type in the category filter options', async () => {
        render(
            <PaymentsListView
                profile={{ roles: ['Payment Admin'] } as any}
            />,
        )

        await screen.findByText('Member earnings will appear here.')

        const filterProps = mockFilterBar.mock.calls.at(-1)?.[0]
        const typeFilter = filterProps.filters.find((filter: any) => filter.key === 'category')

        expect(typeFilter.options.some((option: any) => (
            option.value === 'TOPGEAR_PAYMENT' && option.label === 'Topgear Payment'
        )))
            .toBe(true)
    })
})
