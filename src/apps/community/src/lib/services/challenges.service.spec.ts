/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetPaginatedAsync } from '~/libs/core'

import { SUBMITTER_ROLE_ID } from '../../config/index.config'

import { fetchChallengeRegistrants } from './challenges.service'

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
    xhrDeleteAsync: jest.fn(),
    xhrGetAsync: jest.fn(),
    xhrGetPaginatedAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
}), {
    virtual: true,
})

describe('fetchChallengeRegistrants', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('loads submitter resources from the flat resources endpoint', async () => {
        const mockedGetPaginated = xhrGetPaginatedAsync as jest.Mock
        const expectedFirstPageUrl = 'https://example.com/v6/resources?challengeId=challenge-1&page=1'
            + `&perPage=500&roleId=${SUBMITTER_ROLE_ID}`
        const expectedSecondPageUrl = 'https://example.com/v6/resources?challengeId=challenge-1&page=2'
            + `&perPage=500&roleId=${SUBMITTER_ROLE_ID}`

        mockedGetPaginated
            .mockResolvedValueOnce({
                data: [{
                    countryInfo: {
                        countryCode: 'US',
                        countryFlag: 'https://example.com/us.svg',
                    },
                    created: '2026-06-01T09:52:10.000Z',
                    memberHandle: 'member1',
                    rating: 1200,
                    submissionTime: '2026-06-01T10:52:10.000Z',
                }],
                page: 1,
                perPage: 500,
                total: 2,
                totalPages: 2,
            })
            .mockResolvedValueOnce({
                data: [{
                    countryCode: 'CA',
                    countryFlag: 'https://example.com/ca.svg',
                    createdAt: '2026-06-01T11:02:17.000Z',
                    submissionDate: '2026-06-01T12:02:17.000Z',
                    userHandle: 'member2',
                }],
                page: 2,
                perPage: 500,
                total: 2,
                totalPages: 2,
            })

        await expect(fetchChallengeRegistrants('challenge-1'))
            .resolves
            .toEqual([
                {
                    countryCode: 'US',
                    countryFlag: 'https://example.com/us.svg',
                    created: '2026-06-01T09:52:10.000Z',
                    memberHandle: 'member1',
                    rating: 1200,
                    submissionDate: '2026-06-01T10:52:10.000Z',
                },
                {
                    countryCode: 'CA',
                    countryFlag: 'https://example.com/ca.svg',
                    created: '2026-06-01T11:02:17.000Z',
                    memberHandle: 'member2',
                    rating: undefined,
                    submissionDate: '2026-06-01T12:02:17.000Z',
                },
            ])

        expect(xhrGetPaginatedAsync)
            .toHaveBeenNthCalledWith(
                1,
                expectedFirstPageUrl,
            )
        expect(xhrGetPaginatedAsync)
            .toHaveBeenNthCalledWith(
                2,
                expectedSecondPageUrl,
            )
    })
})
