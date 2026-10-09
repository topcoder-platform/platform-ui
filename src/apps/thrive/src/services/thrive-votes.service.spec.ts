/* eslint-disable unicorn/no-null -- the website API reports "no vote" as JSON null. */
import { tokenGetAsync } from '~/libs/core'

import { castThriveVote, getThriveVote } from './thrive-votes.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: { WEBSITE_API_URL: 'https://www.topcoder-dev.com/__api' },
}), { virtual: true })
jest.mock('~/libs/core', () => ({ tokenGetAsync: jest.fn() }), { virtual: true })

const fetchMock = jest.fn()
const originalFetch = global.fetch

/** Creates a minimal fetch response. */
function response(data: unknown, status: number = 200): Partial<Response> {
    return { json: async () => data, ok: status < 400, status }
}

beforeEach(() => {
    global.fetch = fetchMock
    fetchMock.mockReset();
    (tokenGetAsync as jest.Mock).mockResolvedValue({ token: 'member-token' })
})
afterAll(() => {
    global.fetch = originalFetch
})

describe('Thrive vote service', () => {
    it('loads the member vote with the refreshed token', async () => {
        fetchMock.mockResolvedValue(response({ downvotes: 1, upvotes: 4, vote: 'up' }))
        await expect(getThriveVote('article/1')).resolves.toEqual({ downvotes: 1, upvotes: 4, vote: 'up' })
        expect(fetchMock)
            .toHaveBeenCalledWith(
                'https://www.topcoder-dev.com/__api/thrive/articles/article%2F1/vote',
                expect.objectContaining({ credentials: 'omit', headers: { Authorization: 'Bearer member-token' } }),
            )
    })

    it('posts votes and clears them with JSON null', async () => {
        fetchMock.mockResolvedValue(response({ downvotes: 0, upvotes: 3, vote: null }))
        await expect(castThriveVote('article-1', 'none')).resolves.toEqual({ downvotes: 0, upvotes: 3, vote: null })
        expect(fetchMock.mock.calls[0][1])
            .toEqual(expect.objectContaining({
                body: '{"vote":null}',
                headers: { Authorization: 'Bearer member-token', 'Content-Type': 'application/json' },
                method: 'POST',
            }))
        fetchMock.mockResolvedValue(response({ downvotes: 0, upvotes: 4, vote: 'up' }))
        await castThriveVote('article-1', 'up')
        expect(fetchMock.mock.calls[1][1].body)
            .toBe('{"vote":"up"}')
    })

    it('rejects signed-out members, failures, and malformed responses', async () => {
        fetchMock.mockResolvedValue(response({ status: 502 }, 502))
        await expect(castThriveVote('article-1', 'up')).rejects.toMatchObject({ status: 502 })
        fetchMock.mockResolvedValue(response({ upvotes: 'many', vote: 'up' }))
        await expect(getThriveVote('article-1')).rejects.toMatchObject({ status: 502 })
        fetchMock.mockRejectedValue(new TypeError('offline'))
        await expect(getThriveVote('article-1')).rejects.toMatchObject({ status: 0 })
        fetchMock.mockClear();
        (tokenGetAsync as jest.Mock).mockResolvedValue({})
        await expect(castThriveVote('article-1', 'up')).rejects.toMatchObject({ status: 401 })
        expect(fetchMock).not.toHaveBeenCalled()
    })
})
