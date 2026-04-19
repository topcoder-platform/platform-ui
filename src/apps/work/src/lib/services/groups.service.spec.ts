/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetPaginatedAsync } from '~/libs/core'

import { fetchGroups } from './groups.service'

jest.mock('~/libs/core', () => ({
    xhrCreateInstance: jest.fn(() => ({
        defaults: {
            headers: {
                common: {},
            },
        },
    })),
    xhrDeleteAsync: jest.fn(),
    xhrGetAsync: jest.fn(),
    xhrGetPaginatedAsync: jest.fn(),
    xhrPatchAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
    xhrPutAsync: jest.fn(),
}), {
    virtual: true,
})
jest.mock('../constants', () => ({
    GROUPS_API_URL: 'https://example.com/groups',
}))

describe('fetchGroups', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('merges all paginated accessible group results when hydrating saved group ids', async () => {
        const mockedGetPaginated = xhrGetPaginatedAsync as jest.Mock

        mockedGetPaginated
            .mockResolvedValueOnce({
                data: [
                    {
                        id: 'group-1',
                        name: ' Hide Challenges ',
                    },
                ],
                page: 1,
                perPage: 1000,
                total: 2,
                totalPages: 2,
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        id: 'group-2',
                        name: 'QA - Public',
                    },
                ],
                page: 2,
                perPage: 1000,
                total: 2,
                totalPages: 2,
            })

        await expect(fetchGroups({
            name: 'Hide',
        }))
            .resolves
            .toEqual([
                expect.objectContaining({
                    id: 'group-1',
                    name: 'Hide Challenges',
                }),
                expect.objectContaining({
                    id: 'group-2',
                    name: 'QA - Public',
                }),
            ])

        expect(mockedGetPaginated)
            .toHaveBeenNthCalledWith(
                1,
                'https://example.com/groups?page=1&perPage=1000&name=Hide',
            )
        expect(mockedGetPaginated)
            .toHaveBeenNthCalledWith(
                2,
                'https://example.com/groups?page=2&perPage=1000&name=Hide',
            )
    })
})
