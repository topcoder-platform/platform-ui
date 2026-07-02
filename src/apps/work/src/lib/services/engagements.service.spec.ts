/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetPaginatedAsync } from '~/libs/core'

import {
    normalizeEngagement,
    toEngagementStatusApi,
} from '../utils'

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
    const mockedGetPaginatedAsync = xhrGetPaginatedAsync as jest.Mock
    const mockedNormalizeEngagement = normalizeEngagement as jest.Mock
    const mockedToEngagementStatusApi = toEngagementStatusApi as jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()
        mockedGetPaginatedAsync.mockReset()
        mockedNormalizeEngagement.mockImplementation((engagement: unknown) => engagement)
        mockedToEngagementStatusApi.mockImplementation((value?: string) => value || '')
    })

    it('serializes projectIds as repeated query parameters', async () => {
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

    it('fetches each selected engagement status with a single-status API request', async () => {
        mockedGetPaginatedAsync
            .mockResolvedValueOnce({
                data: [{ id: 'open-engagement' }],
                page: 1,
                perPage: 20,
                total: 1,
                totalPages: 1,
            })
            .mockResolvedValueOnce({
                data: [{ id: 'active-engagement' }],
                page: 1,
                perPage: 20,
                total: 1,
                totalPages: 1,
            })

        const result = await fetchEngagements({
            includePrivate: true,
            status: ['Open', 'Active'],
        }, {
            page: 1,
            perPage: 20,
        })

        expect(mockedGetPaginatedAsync)
            .toHaveBeenNthCalledWith(
                1,
                'https://example.com/engagements/engagements?status=Open&includePrivate=true&page=1&perPage=20',
            )
        expect(mockedGetPaginatedAsync)
            .toHaveBeenNthCalledWith(
                2,
                'https://example.com/engagements/engagements?status=Active&includePrivate=true&page=1&perPage=20',
            )
        expect(result)
            .toEqual({
                data: [
                    expect.objectContaining({ id: 'open-engagement' }),
                    expect.objectContaining({ id: 'active-engagement' }),
                ],
                metadata: {
                    page: 1,
                    perPage: 20,
                    total: 2,
                    totalPages: 1,
                },
            })
    })

    it('returns an empty result without calling the API when projectIds is empty', async () => {
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
