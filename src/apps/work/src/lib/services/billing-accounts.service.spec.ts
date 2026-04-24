/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetAsync } from '~/libs/core'

import {
    BillingAccountDetails,
    combineBillingAccountLineItems,
    fetchBillingAccounts,
    fetchBillingAccountById,
    searchBillingAccounts,
} from './billing-accounts.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: {
            V6: 'https://example.com/v6',
        },
    },
}), {
    virtual: true,
})
jest.mock('~/libs/core', () => ({
    xhrCreateInstance: jest.fn(() => ({
        defaults: {
            headers: {
                common: {},
            },
        },
    })),
    xhrGetAsync: jest.fn(),
}), {
    virtual: true,
})

const NULL_EXTERNAL_NAME = JSON.parse('null') as null

describe('fetchBillingAccounts', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('requests a large lookup page for project billing summaries', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync.mockResolvedValue({
            data: [
                {
                    budget: 1000,
                    consumedBudget: 225,
                    id: 80001063,
                    lockedBudget: 125,
                    name: 'Platform Dev - One',
                },
            ],
        })

        const result = await fetchBillingAccounts()

        expect(result)
            .toEqual([
                {
                    budget: 1000,
                    consumedBudget: 225,
                    id: 80001063,
                    lockedBudget: 125,
                    name: 'Platform Dev - One',
                },
            ])
        expect(mockedGetAsync)
            .toHaveBeenCalledWith('https://example.com/v6/billing-accounts?perPage=1000')
    })
})

describe('searchBillingAccounts', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('includes the userId filter when provided', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync.mockResolvedValue({
            data: [
                {
                    id: 80001063,
                    name: 'Platform Dev - One',
                },
            ],
        })

        const result = await searchBillingAccounts({
            name: 'Platform',
            page: 2,
            perPage: 5,
            userId: '12345',
        })

        expect(result)
            .toEqual([
                {
                    id: 80001063,
                    name: 'Platform Dev - One',
                },
            ])
        expect(mockedGetAsync)
            .toHaveBeenCalledWith(
                'https://example.com/v6/billing-accounts?name=Platform&page=2&perPage=5&userId=12345',
            )
    })
})

describe('fetchBillingAccountById', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('fetches billing account details with typed external-entry line items', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock
        const billingAccountDetails = {
            budget: 5000,
            consumedAmounts: [
                {
                    amount: 100,
                    date: '2026-02-11T00:00:00.000Z',
                    externalId: 'engagement-200',
                    externalName: 'Engagement Two Hundred',
                    externalType: 'ENGAGEMENT',
                },
            ],
            consumedBudget: 100,
            id: 80001063,
            lockedAmounts: [
                {
                    amount: '250.50',
                    challengeId: 'legacy-challenge-100',
                    date: '2026-02-10T00:00:00.000Z',
                    externalId: 'challenge-100',
                    externalName: 'Challenge One Hundred',
                    externalType: 'CHALLENGE',
                },
            ],
            lockedBudget: 250.50,
            name: 'Platform Dev - One',
            totalBudgetRemaining: 4649.50,
        } as BillingAccountDetails

        mockedGetAsync.mockResolvedValue(billingAccountDetails)

        const result = await fetchBillingAccountById(' 80001063 ')

        expect(result)
            .toEqual(billingAccountDetails)
        expect(result.lockedAmounts[0])
            .toMatchObject({
                amount: '250.50',
                challengeId: 'legacy-challenge-100',
                date: '2026-02-10T00:00:00.000Z',
                externalId: 'challenge-100',
                externalName: 'Challenge One Hundred',
                externalType: 'CHALLENGE',
            })
        expect(result.consumedAmounts[0])
            .toMatchObject({
                amount: 100,
                date: '2026-02-11T00:00:00.000Z',
                externalId: 'engagement-200',
                externalName: 'Engagement Two Hundred',
                externalType: 'ENGAGEMENT',
            })
        expect(mockedGetAsync)
            .toHaveBeenCalledWith('https://example.com/v6/billing-accounts/80001063')
    })
})

describe('combineBillingAccountLineItems', () => {
    it('normalizes typed external entries into status-aware UI rows', () => {
        const billingAccountDetails = {
            budget: 2000,
            consumedAmounts: [
                {
                    amount: '75',
                    date: '2026-02-12T00:00:00.000Z',
                    externalId: 'assignment-300',
                    externalName: 'Engagement Assignment',
                    externalType: 'ENGAGEMENT',
                },
                {
                    amount: '75',
                    date: '2026-02-12T00:00:00.000Z',
                    externalId: 'assignment-300',
                    externalName: 'Engagement Assignment',
                    externalType: 'ENGAGEMENT',
                },
            ],
            consumedBudget: 150,
            id: 80001063,
            lockedAmounts: [
                {
                    amount: '125.25',
                    challengeId: 'legacy-challenge-100',
                    createdAt: '2025-01-01T00:00:00.000Z',
                    date: '2026-02-10T00:00:00.000Z',
                    externalId: 'challenge-100',
                    externalName: 'Challenge One Hundred',
                    externalType: 'CHALLENGE',
                },
                {
                    amount: 50,
                    challengeId: 'legacy-challenge-should-not-drive-type',
                    date: '2026-02-11T00:00:00.000Z',
                    externalId: 'engagement-legacy',
                    externalName: 'Legacy Engagement',
                    externalType: 'ENGAGEMENT',
                },
            ],
            lockedBudget: 175.25,
            name: 'Platform Dev - One',
            totalBudgetRemaining: 1674.75,
        } as unknown as BillingAccountDetails

        const result = combineBillingAccountLineItems(billingAccountDetails)

        expect(result)
            .toHaveLength(4)
        expect(result[0])
            .toMatchObject({
                amount: 125.25,
                date: '2026-02-10T00:00:00.000Z',
                externalId: 'challenge-100',
                externalName: 'Challenge One Hundred',
                externalType: 'CHALLENGE',
                status: 'locked',
            })
        expect(result[1])
            .toMatchObject({
                amount: 50,
                externalId: 'engagement-legacy',
                externalName: 'Legacy Engagement',
                externalType: 'ENGAGEMENT',
                status: 'locked',
            })
        expect(result[1].externalId)
            .not
            .toBe('legacy-challenge-should-not-drive-type')

        const consumedRows = result.filter(item => item.status === 'consumed')

        expect(consumedRows)
            .toHaveLength(2)
        expect(consumedRows[0])
            .toMatchObject({
                date: '2026-02-12T00:00:00.000Z',
                externalId: 'assignment-300',
                externalType: 'ENGAGEMENT',
                status: 'consumed',
            })
        expect(consumedRows[1])
            .toMatchObject({
                date: '2026-02-12T00:00:00.000Z',
                externalId: 'assignment-300',
                externalType: 'ENGAGEMENT',
                status: 'consumed',
            })
        expect(consumedRows[0].id)
            .not
            .toBe(consumedRows[1].id)
    })

    it('preserves legacy challenge ids without normalizing them into canonical external ids', () => {
        const billingAccountDetails = {
            budget: 2000,
            consumedAmounts: [],
            consumedBudget: 0,
            id: 80001063,
            lockedAmounts: [
                {
                    amount: '125.25',
                    challengeId: 'legacy-challenge-100',
                    date: '2026-02-10T00:00:00.000Z',
                    externalName: 'Legacy Challenge One Hundred',
                    externalType: 'CHALLENGE',
                },
            ],
            lockedBudget: 125.25,
            name: 'Platform Dev - One',
            totalBudgetRemaining: 1874.75,
        } as BillingAccountDetails

        const result = combineBillingAccountLineItems(billingAccountDetails)

        expect(result)
            .toHaveLength(1)
        expect(result[0])
            .toMatchObject({
                amount: 125.25,
                challengeId: 'legacy-challenge-100',
                date: '2026-02-10T00:00:00.000Z',
                externalName: 'Legacy Challenge One Hundred',
                externalType: 'CHALLENGE',
                status: 'locked',
            })
        expect(Object.prototype.hasOwnProperty.call(result[0], 'externalId'))
            .toBe(false)
        expect(result[0].externalId)
            .toBeUndefined()
    })

    it('normalizes null external names from canonical or legacy ids', () => {
        const billingAccountDetails = {
            budget: 2000,
            consumedAmounts: [
                {
                    amount: 75,
                    date: '2026-02-12T00:00:00.000Z',
                    externalId: 'assignment-300',
                    externalName: NULL_EXTERNAL_NAME,
                    externalType: 'ENGAGEMENT',
                },
            ],
            consumedBudget: 75,
            id: 80001063,
            lockedAmounts: [
                {
                    amount: 125,
                    challengeId: 'legacy-challenge-100',
                    date: '2026-02-10T00:00:00.000Z',
                    externalName: NULL_EXTERNAL_NAME,
                    externalType: 'CHALLENGE',
                },
            ],
            lockedBudget: 125,
            name: 'Platform Dev - One',
            totalBudgetRemaining: 1800,
        } as BillingAccountDetails

        const result = combineBillingAccountLineItems(billingAccountDetails)

        expect(result[0].externalName)
            .toBe('legacy-challenge-100')
        expect(result[1].externalName)
            .toBe('assignment-300')
    })
})
