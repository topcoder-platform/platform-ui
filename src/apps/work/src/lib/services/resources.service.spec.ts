/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetPaginatedAsync } from '~/libs/core'

import { fetchResources } from './resources.service'

jest.mock('~/libs/core', () => ({
    xhrCreateInstance: jest.fn(() => ({
        defaults: {
            headers: {
                common: {},
            },
        },
    })),
    xhrGetAsync: jest.fn(),
    xhrGetPaginatedAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
}), {
    virtual: true,
})
jest.mock('../constants', () => ({
    RESOURCE_ROLES_API_URL: 'https://example.com/resource-roles',
    RESOURCES_API_URL: 'https://example.com/resources',
}))

describe('fetchResources', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('maps memberEmail from the resources API into the work resource email field', async () => {
        const mockedGetPaginated = xhrGetPaginatedAsync as jest.Mock

        mockedGetPaginated.mockResolvedValue({
            data: [
                {
                    challengeId: 'challenge-1',
                    created: '2026-03-27T00:00:00.000Z',
                    id: 'resource-1',
                    memberEmail: 'member@example.com',
                    memberHandle: 'member1',
                    memberId: '123',
                    roleId: 'role-1',
                },
            ],
            page: 1,
            perPage: 5000,
            total: 1,
            totalPages: 1,
        })

        await expect(fetchResources('challenge-1'))
            .resolves
            .toEqual([
                expect.objectContaining({
                    challengeId: 'challenge-1',
                    email: 'member@example.com',
                    id: 'resource-1',
                    memberHandle: 'member1',
                    memberId: '123',
                    roleId: 'role-1',
                }),
            ])
    })
})
