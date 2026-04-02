/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import React from 'react'
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import { getMemberHandle, getPayments } from '../../../lib/services/wallet'
import PaymentsListView from './PaymentsListView'

const mockFilterBar = jest.fn((props: any) => (
    <div data-testid='filter-bar'>
        {props.selectedValueOverrides?.status ?? ''}
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
    default: function PaymentTable() {
        return <div>Payment Table</div>
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
    ConfirmModal: () => <></>,
    InputText: () => <></>,
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

const emptyPaymentsResponse = {
    pagination: {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    },
    winnings: [],
}

describe('PaymentsListView', () => {
    beforeEach(() => {
        mockFilterBar.mockClear()
        mockedGetPayments.mockResolvedValue(emptyPaymentsResponse)
        mockedGetMemberHandle.mockResolvedValue(new Map())
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('defaults the engagement approver view to the On Hold (Admin) status filter', async () => {
        render(
            <PaymentsListView
                profile={{ roles: ['Engagement Payment Approver'] } as any}
            />,
        )

        await screen.findByText('No payments match your filters.')

        expect(mockedGetPayments)
            .toHaveBeenLastCalledWith(10, 0, {
                category: ['ENGAGEMENT_PAYMENT'],
                status: ['ON_HOLD_ADMIN'],
            })
        expect(mockFilterBar)
            .toHaveBeenCalled()
        expect(mockFilterBar.mock.calls.at(-1)?.[0].selectedValueOverrides)
            .toEqual({
                category: 'ENGAGEMENT_PAYMENT',
                status: 'ON_HOLD_ADMIN',
            })
    })

    it('applies the default approver status after switching from admin view', async () => {
        render(
            <PaymentsListView
                profile={{ roles: ['Payment Admin', 'Engagement Payment Approver'] } as any}
            />,
        )

        await screen.findByText('Member earnings will appear here.')

        expect(mockedGetPayments)
            .toHaveBeenLastCalledWith(10, 0, {})

        fireEvent.click(screen.getByRole('button', { name: 'Engagement Approver View' }))

        await screen.findByText('No payments match your filters.')

        expect(mockedGetPayments)
            .toHaveBeenLastCalledWith(10, 0, {
                category: ['ENGAGEMENT_PAYMENT'],
                status: ['ON_HOLD_ADMIN'],
            })

        expect(mockFilterBar.mock.calls.at(-1)?.[0].selectedValueOverrides)
            .toEqual({
                category: 'ENGAGEMENT_PAYMENT',
                status: 'ON_HOLD_ADMIN',
            })
    })

    it('lets an explicit status filter override the default approver status', async () => {
        render(
            <PaymentsListView
                profile={{ roles: ['Engagement Payment Approver'] } as any}
            />,
        )

        await screen.findByText('No payments match your filters.')

        await act(async () => {
            mockFilterBar.mock.calls.at(-1)?.[0].onFilterChange('status', ['PAID'])
        })

        await waitFor(() => {
            expect(mockedGetPayments)
                .toHaveBeenLastCalledWith(10, 0, {
                    category: ['ENGAGEMENT_PAYMENT'],
                    status: ['PAID'],
                })
        })

        expect(mockFilterBar.mock.calls.at(-1)?.[0].selectedValueOverrides)
            .toEqual({
                category: 'ENGAGEMENT_PAYMENT',
                status: 'PAID',
            })
    })
})
