import { getMemberProfilesByUserIds } from './member-profile.service'

const mockXhrGetAsync = jest.fn()

jest.mock('~/config', () => ({
    EnvironmentConfig: { API: { V6: 'https://api.example/v6' } },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrGetAsync: (...args: unknown[]) => mockXhrGetAsync(...args),
}), { virtual: true })

describe('member profile service', () => {
    beforeEach(() => jest.clearAllMocks())

    it('de-duplicates ids and normalizes the public member projection', async () => {
        mockXhrGetAsync.mockResolvedValue({
            result: {
                content: [{
                    handle: 'dok',
                    maxRating: { rating: 2_345 },
                    photoURL: 'https://cdn.example/dok.png',
                    userId: 1,
                }, {
                    handle: 'NoPhoto',
                    photoURL: 'data:image/png;base64,unsafe',
                    rating: '1200',
                    userId: '2',
                }],
            },
        })

        await expect(getMemberProfilesByUserIds(['1', '1', ' 2 ', '']))
            .resolves.toEqual([{
                handle: 'dok',
                maxRating: 2_345,
                photoURL: 'https://cdn.example/dok.png',
                userId: '1',
            }, {
                handle: 'NoPhoto',
                maxRating: 1200,
                photoURL: undefined,
                userId: '2',
            }])

        const requestedUrl = new URL(mockXhrGetAsync.mock.calls[0][0])
        expect(requestedUrl.pathname)
            .toBe('/v6/members')
        expect(requestedUrl.searchParams.get('fields'))
            .toBe('userId,handle,photoURL,maxRating')
        expect(requestedUrl.searchParams.getAll('userIds[]'))
            .toEqual(['1', '2'])
        expect(requestedUrl.searchParams.get('perPage'))
            .toBe('2')
    })

    it('keeps successful batches when another Members API batch fails', async () => {
        const userIds = Array.from({ length: 51 }, (_, index) => String(index + 1))
        mockXhrGetAsync
            .mockRejectedValueOnce(new Error('temporary failure'))
            .mockResolvedValueOnce([{
                handle: 'FiftyOne',
                photoURL: 'https://cdn.example/51.png',
                userId: 51,
            }])

        await expect(getMemberProfilesByUserIds(userIds))
            .resolves.toEqual([{
                handle: 'FiftyOne',
                maxRating: undefined,
                photoURL: 'https://cdn.example/51.png',
                userId: '51',
            }])
        expect(mockXhrGetAsync)
            .toHaveBeenCalledTimes(2)
    })

    it('does not request an empty member-id set', async () => {
        await expect(getMemberProfilesByUserIds([]))
            .resolves.toEqual([])
        expect(mockXhrGetAsync)
            .not.toHaveBeenCalled()
    })
})
