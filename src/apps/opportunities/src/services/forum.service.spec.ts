import {
    challengeForumTopicsUrl,
    createForumPost,
    createForumTopic,
    deleteForumPost,
    deleteForumTopic,
    getChallengeForumTopics,
    getForumTopicDetail,
    markForumTopicRead,
    setForumPostReaction,
    setForumTopicWatching,
    updateForumPost,
    updateForumTopic,
} from './forum.service'

const mockXhrDeleteAsync = jest.fn()
const mockXhrGetAsync = jest.fn()
const mockXhrPatchAsync = jest.fn()
const mockXhrPostAsync = jest.fn()
const mockXhrPutAsync = jest.fn()

jest.mock('~/config', () => ({
    EnvironmentConfig: { API: { V6: 'https://api.example/v6' } },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrDeleteAsync: (...args: unknown[]) => mockXhrDeleteAsync(...args),
    xhrGetAsync: (...args: unknown[]) => mockXhrGetAsync(...args),
    xhrPatchAsync: (...args: unknown[]) => mockXhrPatchAsync(...args),
    xhrPostAsync: (...args: unknown[]) => mockXhrPostAsync(...args),
    xhrPutAsync: (...args: unknown[]) => mockXhrPutAsync(...args),
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

    it('routes topic create, update, and delete commands through authenticated XHR', async () => {
        mockXhrPostAsync.mockResolvedValue({ topic: { id: 'topic-1' } })
        mockXhrPatchAsync.mockResolvedValue({ id: 'topic-1' })
        mockXhrDeleteAsync.mockResolvedValue({ id: 'topic-1' })

        await createForumTopic({
            challengeId: 'challenge-id',
            content: 'Starter',
            title: 'New topic',
        })
        await updateForumTopic('topic/id', 'Renamed')
        await deleteForumTopic('topic/id')

        expect(mockXhrPostAsync)
            .toHaveBeenCalledWith('https://api.example/v6/forums/topics', {
                challengeId: 'challenge-id',
                content: 'Starter',
                title: 'New topic',
            })
        expect(mockXhrPatchAsync)
            .toHaveBeenCalledWith('https://api.example/v6/forums/topics/topic%2Fid', { title: 'Renamed' })
        expect(mockXhrDeleteAsync)
            .toHaveBeenCalledWith('https://api.example/v6/forums/topics/topic%2Fid')
    })

    it('routes post create, update, and delete commands through authenticated XHR', async () => {
        mockXhrPostAsync.mockResolvedValue({ id: 'post-1' })
        mockXhrPatchAsync.mockResolvedValue({ id: 'post-1' })
        mockXhrDeleteAsync.mockResolvedValue({ id: 'post-1' })

        await createForumPost('topic/id', {
            content: 'Reply',
            parentId: 'post/id',
            parentType: 'POST',
        })
        await updateForumPost('post/id', 'Edited')
        await deleteForumPost('post/id')

        expect(mockXhrPostAsync)
            .toHaveBeenCalledWith('https://api.example/v6/forums/topics/topic%2Fid/posts', {
                content: 'Reply',
                parentId: 'post/id',
                parentType: 'POST',
            })
        expect(mockXhrPatchAsync)
            .toHaveBeenCalledWith('https://api.example/v6/forums/posts/post%2Fid', { content: 'Edited' })
        expect(mockXhrDeleteAsync)
            .toHaveBeenCalledWith('https://api.example/v6/forums/posts/post%2Fid')
    })

    it('sets and removes the current member post reaction through authenticated XHR', async () => {
        mockXhrPutAsync.mockResolvedValue({ viewerReaction: 'THUMBS_UP' })
        mockXhrDeleteAsync.mockResolvedValue({ viewerReaction: undefined })

        await setForumPostReaction('post/id', 'THUMBS_UP')
        await setForumPostReaction('post/id', undefined)

        expect(mockXhrPutAsync)
            .toHaveBeenCalledWith(
                'https://api.example/v6/forums/posts/post%2Fid/reaction',
                { reaction: 'THUMBS_UP' },
            )
        expect(mockXhrDeleteAsync)
            .toHaveBeenCalledWith('https://api.example/v6/forums/posts/post%2Fid/reaction')
    })

    it('routes watch and read-state commands without impersonation fields', async () => {
        mockXhrPutAsync.mockResolvedValue({})
        mockXhrDeleteAsync.mockResolvedValue({ watching: false })

        await setForumTopicWatching('topic/id', true)
        await setForumTopicWatching('topic/id', false)
        await markForumTopicRead('topic/id')

        expect(mockXhrPutAsync)
            .toHaveBeenNthCalledWith(1, 'https://api.example/v6/forums/topics/topic%2Fid/watch', {})
        expect(mockXhrDeleteAsync)
            .toHaveBeenCalledWith('https://api.example/v6/forums/topics/topic%2Fid/watch')
        expect(mockXhrPutAsync)
            .toHaveBeenNthCalledWith(2, 'https://api.example/v6/forums/topics/topic%2Fid/read-state', {})
    })
})
