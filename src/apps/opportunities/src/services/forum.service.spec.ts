import {
    challengeForumTopicsUrl,
    getChallengeForumTopics,
    getForumTopicDetail,
} from './forum.service'

const mockXhrGetAsync = jest.fn()

jest.mock('~/config', () => ({
    EnvironmentConfig: { API: { V6: 'https://api.example/v6' } },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrGetAsync: (...args: unknown[]) => mockXhrGetAsync(...args),
}), { virtual: true })

describe('forum service', () => {
    beforeEach(() => jest.clearAllMocks())

    it('builds an encoded, bounded challenge topic page URL', () => {
        expect(challengeForumTopicsUrl('challenge/id', 0, 0))
            .toBe('https://api.example/v6/forums/topics/challenges/challenge%2Fid?page=1&perPage=1')
    })

    it('loads challenge topics through the authenticated global XHR client', async () => {
        const page = {
            data: [],
            meta: { page: 1, perPage: 100, totalCount: 0, totalPages: 0 },
        }
        mockXhrGetAsync.mockResolvedValue(page)

        await expect(getChallengeForumTopics('challenge-id'))
            .resolves.toEqual({
                data: [],
                sourceTotalCount: 0,
                truncated: false,
            })
        expect(mockXhrGetAsync)
            .toHaveBeenCalledWith(
                'https://api.example/v6/forums/topics/challenges/challenge-id?page=1&perPage=100',
            )
    })

    it('aggregates and de-duplicates every page reported by the Forums API', async () => {
        mockXhrGetAsync
            .mockResolvedValueOnce({
                data: [{ id: 'topic-1' }],
                meta: { page: 1, perPage: 100, totalCount: 3, totalPages: 3 },
            })
            .mockResolvedValueOnce({
                data: [{ id: 'topic-2' }],
                meta: { page: 2, perPage: 100, totalCount: 3, totalPages: 3 },
            })
            .mockResolvedValueOnce({
                data: [{ id: 'topic-2' }, { id: 'topic-3' }],
                meta: { page: 3, perPage: 100, totalCount: 3, totalPages: 3 },
            })

        await expect(getChallengeForumTopics('challenge-id'))
            .resolves.toEqual({
                data: [{ id: 'topic-1' }, { id: 'topic-2' }, { id: 'topic-3' }],
                sourceTotalCount: 3,
                truncated: false,
            })
        expect(mockXhrGetAsync)
            .toHaveBeenCalledTimes(3)
    })

    it('marks counts as bounded when the API reports more than the safe page cap', async () => {
        mockXhrGetAsync
            .mockResolvedValueOnce({
                data: [{ id: 'topic-1' }],
                meta: { page: 1, perPage: 1, totalCount: 4, totalPages: 4 },
            })
            .mockResolvedValueOnce({
                data: [{ id: 'topic-2' }],
                meta: { page: 2, perPage: 1, totalCount: 4, totalPages: 4 },
            })

        await expect(getChallengeForumTopics('challenge-id', 1, 2))
            .resolves.toEqual({
                data: [{ id: 'topic-1' }, { id: 'topic-2' }],
                sourceTotalCount: 4,
                truncated: true,
            })
    })

    it('loads an encoded topic detail through the Forums API', async () => {
        const detail = { posts: [], topic: { id: 'topic/id' } }
        mockXhrGetAsync.mockResolvedValue(detail)

        await expect(getForumTopicDetail('topic/id'))
            .resolves.toBe(detail)
        expect(mockXhrGetAsync)
            .toHaveBeenCalledWith('https://api.example/v6/forums/topics/topic%2Fid')
    })
})
