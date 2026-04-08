/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetAsync } from '~/libs/core'

import { searchBillingAccounts } from './billing-accounts.service'

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
