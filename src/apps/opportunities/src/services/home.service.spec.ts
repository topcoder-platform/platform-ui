import { buildHomeChallengeFeedUrl, getHomeChallengeFeed } from './home.service'

const mockXhrGetAsync = jest.fn()

jest.mock('~/config', () => ({
    EnvironmentConfig: { API: { V6: 'https://api.example/v6' } },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrGetAsync: (...args: unknown[]) => mockXhrGetAsync(...args),
}), { virtual: true })

describe('member home service', () => {
    beforeEach(() => jest.clearAllMocks())

    it('requests the community-app dashboard challenge query from Challenge API v6', () => {
        const url = new URL(buildHomeChallengeFeedUrl())

        expect(`${url.origin}${url.pathname}`)
            .toBe('https://api.example/v6/challenges')
        expect(url.searchParams.getAll('types[]'))
            .toEqual(['CH', 'F2F', 'MM'])
        expect(Object.fromEntries(Array.from(url.searchParams.entries())
            .filter(([key]) => key !== 'types[]')))
            .toEqual({
                currentPhaseName: 'Registration',
                isLightweight: 'true',
                page: '1',
                perPage: '20',
                sortBy: 'updated',
                sortOrder: 'desc',
                status: 'ACTIVE',
            })
    })

    it('excludes Innovation Challenges before limiting the feed to five challenges', async () => {
        mockXhrGetAsync.mockResolvedValue([
            { id: 'innovation', name: 'Innovation', tags: ['Innovation Challenge'] },
            ...['1', '2', '3', '4', '5', '6'].map(id => ({ id, name: `Challenge ${id}`, tags: ['AI'] })),
        ])

        const challenges = await getHomeChallengeFeed()

        expect(mockXhrGetAsync)
            .toHaveBeenCalledWith(buildHomeChallengeFeedUrl())
        expect(challenges.map(item => item.id))
            .toEqual(['1', '2', '3', '4', '5'])
    })

    it('accepts the standard result envelope and tolerates a malformed body', async () => {
        mockXhrGetAsync.mockResolvedValueOnce({ result: { content: [{ id: 'wrapped', name: 'Wrapped' }] } })
        await expect(getHomeChallengeFeed()).resolves.toEqual([{ id: 'wrapped', name: 'Wrapped' }])

        mockXhrGetAsync.mockResolvedValueOnce({ content: [{ id: 'content', name: 'Content' }] })
        await expect(getHomeChallengeFeed()).resolves.toEqual([{ id: 'content', name: 'Content' }])

        mockXhrGetAsync.mockResolvedValueOnce({ unexpected: true })
        await expect(getHomeChallengeFeed()).resolves.toEqual([])
    })

    it('propagates Challenge API failures so the feed can offer a retry', async () => {
        mockXhrGetAsync.mockRejectedValue(new Error('Service unavailable'))

        await expect(getHomeChallengeFeed()).rejects.toThrow('Service unavailable')
    })
})
