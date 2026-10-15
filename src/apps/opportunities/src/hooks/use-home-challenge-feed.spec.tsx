/* eslint-disable import/no-extraneous-dependencies, react/jsx-no-bind */
import { FC, ReactNode } from 'react'
import { SWRConfig } from 'swr'

import {
    act,
    renderHook,
    RenderHookResult,
    waitFor,
} from '@testing-library/react'

import { getHomeChallengeFeed, getMemberChallengeRegistrationIds } from '../services'

import { HomeChallengeFeedState, useHomeChallengeFeed } from './use-home-challenge-feed'

jest.mock('../services', () => ({
    getHomeChallengeFeed: jest.fn(),
    getMemberChallengeRegistrationIds: jest.fn(),
}))

const mockedGetFeed = getHomeChallengeFeed as jest.MockedFunction<typeof getHomeChallengeFeed>
const mockedGetRegistrationIds = getMemberChallengeRegistrationIds as jest.MockedFunction<
    typeof getMemberChallengeRegistrationIds
>

/**
 * Isolates the SWR cache for one hook render.
 *
 * @param props hook test children.
 * @returns the children inside a fresh SWR cache.
 */
const Wrapper: FC<{ children?: ReactNode }> = props => (
    <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
        {props.children}
    </SWRConfig>
)

type FeedHookResult = RenderHookResult<HomeChallengeFeedState, unknown>

/**
 * Renders the feed hook with an isolated SWR cache.
 *
 * @param memberId authenticated member ID, when available.
 * @returns hook render result.
 */
function renderFeedHook(memberId?: string): FeedHookResult {
    return renderHook(() => useHomeChallengeFeed(memberId), { wrapper: Wrapper })
}

describe('useHomeChallengeFeed', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedGetRegistrationIds.mockResolvedValue([])
    })

    it('loads the feed and the member registrations', async () => {
        mockedGetFeed.mockResolvedValue([
            { id: 'registered', name: 'Registered challenge' },
            { id: 'open', name: 'Open challenge' },
        ])
        mockedGetRegistrationIds.mockResolvedValue(['registered', 'other'])

        const { result }: FeedHookResult = renderFeedHook('123')

        expect(result.current.loading)
            .toBe(true)
        expect(result.current.challenges)
            .toEqual([])
        await waitFor(() => expect(result.current.loading)
            .toBe(false))
        await waitFor(() => expect(result.current.registeredIds.has('registered'))
            .toBe(true))
        expect(result.current.challenges.map(item => item.id))
            .toEqual(['registered', 'open'])
        expect(result.current.registeredIds.has('open'))
            .toBe(false)
        expect(mockedGetRegistrationIds)
            .toHaveBeenCalledWith('123')
    })

    it('skips the registration lookup until a member ID is available', async () => {
        mockedGetFeed.mockResolvedValue([])

        const { result }: FeedHookResult = renderFeedHook()

        await waitFor(() => expect(result.current.loading)
            .toBe(false))
        expect(mockedGetRegistrationIds).not.toHaveBeenCalled()
        expect(result.current.registeredIds.size)
            .toBe(0)
    })

    it('reports a feed failure and loads again on retry', async () => {
        mockedGetFeed
            .mockRejectedValueOnce(new Error('Service unavailable'))
            .mockResolvedValueOnce([{ id: 'recovered', name: 'Recovered challenge' }])

        const { result }: FeedHookResult = renderFeedHook()

        await waitFor(() => expect(result.current.error?.message)
            .toBe('Service unavailable'))
        expect(result.current.loading)
            .toBe(false)

        act(() => result.current.retry())

        await waitFor(() => expect(result.current.challenges.map(item => item.id))
            .toEqual(['recovered']))
        expect(result.current.error)
            .toBeUndefined()
    })
})
