/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    xhrGetPaginatedAsync,
} from '~/libs/core'

import { getActiveMemberChallenges } from './support-challenges.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: { V6: 'https://api.example.test/v6' },
        CHALLENGE_API_URL: 'https://challenge.example.test/challenges/',
        CHALLENGE_API_VERSION: 'v5',
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrCreateInstance: jest.fn(() => ({
        defaults: { headers: { common: {} } },
    })),
    xhrGetPaginatedAsync: jest.fn(),
}), { virtual: true })

const mockedGetPaginated = xhrGetPaginatedAsync as jest.Mock

describe('Support active challenge service', () => {
    beforeEach(() => {
        mockedGetPaginated.mockReset()
    })

    it('fetches every active resource-scoped page, normalizes, deduplicates, and sorts', async () => {
        mockedGetPaginated
            .mockResolvedValueOnce({
                data: [
                    { id: 'challenge-b', name: 'Zulu' },
                    { id: 'challenge-a', name: ' Alpha ' },
                    { id: undefined, name: 'Invalid' },
                ],
                page: 1,
                perPage: 100,
                total: 4,
                totalPages: 2,
            })
            .mockResolvedValueOnce({
                data: [
                    { id: 'challenge-b', name: 'Duplicate' },
                    { id: 'challenge-c' },
                ],
                page: 2,
                perPage: 100,
                total: 4,
                totalPages: 2,
            })

        await expect(getActiveMemberChallenges(12345))
            .resolves.toEqual([
                { id: 'challenge-a', name: 'Alpha' },
                { id: 'challenge-c', name: 'challenge-c' },
                { id: 'challenge-b', name: 'Zulu' },
            ])

        expect(mockedGetPaginated)
            .toHaveBeenCalledTimes(2)
        expect(mockedGetPaginated.mock.calls[0][0])
            .toBe(
                'https://challenge.example.test/challenges?memberId=12345&page=1&perPage=100'
                + '&sortBy=name&sortOrder=asc&status=ACTIVE',
            )
        expect(mockedGetPaginated.mock.calls[1][0])
            .toContain('page=2')
        expect(mockedGetPaginated.mock.calls[0][1])
            .toBe(mockedGetPaginated.mock.calls[1][1])
        expect(mockedGetPaginated.mock.calls[0][1].defaults.headers.common['app-version'])
            .toBe('v5')
    })

    it('does not query the Challenge API without a member identifier', async () => {
        await expect(getActiveMemberChallenges(' '))
            .resolves.toEqual([])
        expect(mockedGetPaginated)
            .not.toHaveBeenCalled()
    })
})
