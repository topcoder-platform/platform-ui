/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    xhrDeleteAsync,
    xhrGetPaginatedAsync,
} from '~/libs/core'

import {
    buildIndexedChallengesQuery,
    deleteIndexedChallenge,
    fetchIndexedChallenges,
} from './rag-index.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: { V6: 'https://example.com/v6' },
    },
}), {
    virtual: true,
})
jest.mock('~/libs/core', () => ({
    xhrDeleteAsync: jest.fn(),
    xhrGetPaginatedAsync: jest.fn(),
}), {
    virtual: true,
})

describe('rag-index.service', () => {
    const mockedGet = xhrGetPaginatedAsync as jest.Mock
    const mockedDelete = xhrDeleteAsync as jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()
        mockedGet.mockResolvedValue({ data: [], page: 1, perPage: 25, total: 0, totalPages: 0 })
        mockedDelete.mockResolvedValue({ challengeId: 'c-1', deletedChunks: 9 })
    })

    describe('buildIndexedChallengesQuery', () => {
        it('serialises every provided filter', () => {
            const query = buildIndexedChallengesQuery({
                page: 2,
                perPage: 10,
                projectId: '17423',
                search: 'chat',
                track: 'Development',
                type: 'Challenge',
            })

            const params = new URLSearchParams(query)
            expect(params.get('page'))
                .toBe('2')
            expect(params.get('perPage'))
                .toBe('10')
            expect(params.get('projectId'))
                .toBe('17423')
            expect(params.get('search'))
                .toBe('chat')
            expect(params.get('track'))
                .toBe('Development')
            expect(params.get('type'))
                .toBe('Challenge')
        })

        it('omits blank and whitespace-only filters rather than filtering on ""', () => {
            const query = buildIndexedChallengesQuery({
                projectId: '   ',
                search: '',
                track: 'Design',
            })

            expect(query)
                .toBe('track=Design')
        })

        it('trims values and encodes them', () => {
            const query = buildIndexedChallengesQuery({ search: '  data science  ' })
            expect(new URLSearchParams(query)
                .get('search'))
                .toBe('data science')
        })

        it('returns an empty string when nothing is filtered', () => {
            expect(buildIndexedChallengesQuery({}))
                .toBe('')
        })
    })

    describe('fetchIndexedChallenges', () => {
        it('requests the RAG index endpoint with the serialised filters', async () => {
            await fetchIndexedChallenges({ page: 3, perPage: 10, track: 'Design' })

            expect(mockedGet)
                .toHaveBeenCalledTimes(1)
            const [url] = mockedGet.mock.calls[0]
            expect(url)
                .toContain('https://example.com/v6/ai-api/rag/challenges?')
            const params = new URLSearchParams(url.split('?')[1])
            expect(params.get('page'))
                .toBe('3')
            expect(params.get('track'))
                .toBe('Design')
        })

        it('omits the query string entirely when unfiltered', async () => {
            await fetchIndexedChallenges()

            expect(mockedGet)
                .toHaveBeenCalledWith('https://example.com/v6/ai-api/rag/challenges')
        })

        it('passes the paginated response through unchanged', async () => {
            const response = {
                data: [{ challengeId: 'c-1', chunks: 9 }],
                page: 1,
                perPage: 25,
                total: 1,
                totalPages: 1,
            }
            mockedGet.mockResolvedValue(response)

            await expect(fetchIndexedChallenges())
                .resolves.toBe(response)
        })
    })

    describe('deleteIndexedChallenge', () => {
        it('deletes by challenge id and returns the removed chunk count', async () => {
            await expect(deleteIndexedChallenge('c-1'))
                .resolves.toEqual({ challengeId: 'c-1', deletedChunks: 9 })
            expect(mockedDelete)
                .toHaveBeenCalledWith(
                    'https://example.com/v6/ai-api/rag/challenges/c-1',
                )
        })

        it('url-encodes an id containing path-significant characters', async () => {
            await deleteIndexedChallenge('a/b?c')

            expect(mockedDelete)
                .toHaveBeenCalledWith(
                    'https://example.com/v6/ai-api/rag/challenges/a%2Fb%3Fc',
                )
        })
    })
})
