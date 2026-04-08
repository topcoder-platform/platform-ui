/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetPaginatedAsync } from '~/libs/core'

import { fetchEngagements } from './engagements.service'

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
    ENGAGEMENTS_API_URL: 'https://example.com/engagements/engagements',
    ENGAGEMENTS_ROOT_API_URL: 'https://example.com/engagements',
}))
jest.mock('../utils', () => ({
    fromEngagementAnticipatedStartApi: jest.fn((value?: string) => value || ''),
    normalizeEngagement: jest.fn((engagement: unknown) => engagement),
    toEngagementAnticipatedStartApi: jest.fn((value?: string) => value || ''),
    toEngagementRoleApi: jest.fn((value?: string) => value || ''),
    toEngagementStatusApi: jest.fn((value?: string) => value || ''),
    toEngagementWorkloadApi: jest.fn((value?: string) => value || ''),
}))
jest.mock('./skills.service', () => ({
    fetchSkillsByIds: jest.fn(),
}))
jest.mock('./projects.service', () => ({
    fetchProjectById: jest.fn(),
}))

describe('fetchEngagements', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('serializes projectIds as repeated query parameters', async () => {
        const mockedGetPaginatedAsync = xhrGetPaginatedAsync as jest.Mock
        const expectedUrl = 'https://example.com/engagements/engagements'
            + '?includePrivate=true&projectIds=200&projectIds=300&page=1&perPage=20'

        mockedGetPaginatedAsync.mockResolvedValue({
            data: [],
            page: 1,
            perPage: 20,
            total: 0,
            totalPages: 0,
        })

        await fetchEngagements({
            includePrivate: true,
            projectIds: ['200', 300],
        }, {
            page: 1,
            perPage: 20,
        })

        expect(mockedGetPaginatedAsync)
            .toHaveBeenCalledWith(
                expectedUrl,
            )
    })

    it('returns an empty result without calling the API when projectIds is empty', async () => {
        const mockedGetPaginatedAsync = xhrGetPaginatedAsync as jest.Mock

        const result = await fetchEngagements({
            projectIds: [],
        }, {
            page: 1,
            perPage: 20,
        })

        expect(result)
            .toEqual({
                data: [],
                metadata: {
                    page: 1,
                    perPage: 20,
                    total: 0,
                    totalPages: 0,
                },
            })
        expect(mockedGetPaginatedAsync)
            .not.toHaveBeenCalled()
    })
})
