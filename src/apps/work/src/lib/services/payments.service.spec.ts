/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    xhrGetAsync,
} from '~/libs/core'

import {
    fetchBillingAccountById,
} from './billing-accounts.service'
import {
    fetchAssignmentPayments,
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
