/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    xhrGetAsync,
} from '~/libs/core'

import {
    fetchBillingAccountById,
} from './billing-accounts.service'
import {
    findTimesheetPaymentConflicts,
    fetchAssignmentPaymentSplits,
    fetchAssignmentPayments,
    getPaymentReference,
} from './payments.service'
import {
    searchProfilesByUserIds,
} from './users.service'

jest.mock('~/libs/core', () => ({
    xhrGetAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
}), {
    virtual: true,
})
jest.mock('../constants', () => ({
    TC_FINANCE_API_URL: 'https://example.com/finance',
}))
jest.mock('./billing-accounts.service', () => ({
    fetchBillingAccountById: jest.fn(),
}))
jest.mock('./users.service', () => ({
    searchProfilesByUserIds: jest.fn(),
}))

describe('fetchAssignmentPayments', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('hydrates creator handles and billing account names for payment history', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock
        const mockedSearchProfilesByUserIds = searchProfilesByUserIds as jest.Mock
        const mockedFetchBillingAccountById = fetchBillingAccountById as jest.Mock

        mockedGetAsync.mockResolvedValue([
            {
                createdBy: '1001',
                details: [
                    {
                        billingAccount: '80001063',
                        grossAmount: 120,
                        totalAmount: 120,
                    },
                ],
                id: 'payment-1',
            },
        ])
        mockedSearchProfilesByUserIds.mockResolvedValue([
            {
                handle: 'payment.manager',
                userId: '1001',
            },
        ])
        mockedFetchBillingAccountById.mockResolvedValue({
            id: 80001063,
            name: 'BA For Marios',
        })

        const result = await fetchAssignmentPayments('assignment-1')

        expect(mockedGetAsync)
            .toHaveBeenCalledWith('https://example.com/finance/winnings/by-external-id/assignment-1')
        expect(mockedSearchProfilesByUserIds)
            .toHaveBeenCalledWith(['1001'])
        expect(mockedFetchBillingAccountById)
            .toHaveBeenCalledWith('80001063')
        expect(result)
            .toEqual([
                {
                    createdBy: '1001',
                    createdByHandle: 'payment.manager',
                    details: [
                        {
                            billingAccount: '80001063',
                            billingAccountName: 'BA For Marios',
                            grossAmount: 120,
                            totalAmount: 120,
                        },
                    ],
                    id: 'payment-1',
                },
            ])
    })
})

describe('fetchAssignmentPaymentSplits', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns raw payment rows without profile or billing-account hydration', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync.mockResolvedValue({
            data: [
                {
                    billingAccountId: '80001063',
                    challengeFee: '420.66',
                    paymentAmount: '342.00',
                    paymentId: 'payment-5245',
                },
            ],
        })

        const result = await fetchAssignmentPaymentSplits('assignment / 5245')

        expect(mockedGetAsync)
            .toHaveBeenCalledWith(
                'https://example.com/finance/winnings/by-external-id/assignment%20%2F%205245',
            )
        expect(fetchBillingAccountById)
            .not.toHaveBeenCalled()
        expect(searchProfilesByUserIds)
            .not.toHaveBeenCalled()
        expect(result)
            .toEqual([
                {
                    billingAccountId: '80001063',
                    challengeFee: '420.66',
                    paymentAmount: '342.00',
                    paymentId: 'payment-5245',
                },
            ])
    })
})

describe('findTimesheetPaymentConflicts', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns no conflicts when no selected entry ids overlap existing payments', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync.mockResolvedValue({
            data: [
                {
                    attributes: {
                        timesheetEntryIds: ['other-entry-1'],
                    },
                    id: 'win-1',
                },
            ],
        })

        const result = await findTimesheetPaymentConflicts('assignment-1', ['ts-entry-1'])

        expect(result)
            .toEqual({
                conflicts: [],
                overlappingEntryIds: [],
            })
    })

    it('returns overlapping entry ids and payment references when conflicts exist', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync.mockResolvedValue({
            data: [
                {
                    attributes: {
                        timesheetEntryIds: ['ts-entry-1', 'ts-entry-9'],
                    },
                    id: 'win-1',
                },
                {
                    attributes: {
                        timesheetEntryIds: ['ts-entry-2'],
                    },
                    paymentId: 'payment-2',
                },
            ],
        })

        const result = await findTimesheetPaymentConflicts('assignment-1', ['ts-entry-1', 'ts-entry-2'])

        expect(result)
            .toEqual({
                conflicts: [
                    {
                        entryIds: ['ts-entry-1'],
                        paymentReference: 'win-1',
                    },
                    {
                        entryIds: ['ts-entry-2'],
                        paymentReference: 'payment-2',
                    },
                ],
                overlappingEntryIds: ['ts-entry-1', 'ts-entry-2'],
            })
    })
})

describe('getPaymentReference', () => {
    it('prefers the finance winning id when present', () => {
        expect(getPaymentReference({
            id: 'win-123',
            paymentId: 'payment-999',
        }))
            .toBe('win-123')
    })

    it('falls back to payment id when winning id is missing', () => {
        expect(getPaymentReference({ paymentId: 'payment-999' }))
            .toBe('payment-999')
    })

    it('accepts snake_case identifiers from finance API responses', () => {
        expect(getPaymentReference({
            payment_id: 'payment-999',
        } as never))
            .toBe('payment-999')
    })

    it('accepts identifier values nested in response envelopes', () => {
        expect(getPaymentReference({
            data: {
                id: 'win-321',
            },
        } as never))
            .toBe('win-321')
    })

    it('returns undefined when neither id exists', () => {
        expect(getPaymentReference({}))
            .toBeUndefined()
    })
})
