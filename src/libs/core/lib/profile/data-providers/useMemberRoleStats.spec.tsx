/* eslint-disable @typescript-eslint/typedef, import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { FC, ReactNode } from 'react'

import { act, renderHook, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'

import { xhrGetAsync } from '../../xhr'

import { useMemberRoleChallenges } from './useMemberRoleStats'

jest.mock('../../xhr', () => ({
    xhrGetAsync: jest.fn(),
}))

jest.mock('../profile-functions', () => ({
    memberRoleChallengesURL: (
        handle: string,
        role: string,
        page: number,
        perPage: number,
    ): string => (
        `https://api.example.com/members/${handle}/stats/roles/${role}`
        + `/challenges?page=${page}&perPage=${perPage}`
    ),
    memberRoleStatsURL: (handle: string): string => `https://api.example.com/members/${handle}/stats/roles`,
}))

const mockedXhrGetAsync = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>

const TestSwrConfig: FC<{ children: ReactNode }> = props => (
    <SWRConfig
        value={{
            dedupingInterval: 0,
            provider: () => new Map(),
            shouldRetryOnError: false,
        }}
    >
        {props.children}
    </SWRConfig>
)

describe('useMemberRoleChallenges', () => {
    beforeEach(() => {
        mockedXhrGetAsync.mockReset()
    })

    it('loads and combines API pages as the list requests more', async () => {
        mockedXhrGetAsync
            .mockResolvedValueOnce({
                challenges: [{ id: 'challenge-1', name: 'Newest challenge' }],
                fulfillment: {
                    cancelled: 1,
                    completed: 2,
                    rate: 66.67,
                    total: 3,
                },
                page: 1,
                perPage: 100,
                role: 'copilot',
                total: 3,
                totalPages: 3,
                trackCounts: { DEVELOPMENT: 3 },
            } as never)
            .mockResolvedValueOnce({
                challenges: [{ id: 'challenge-2', name: 'Middle challenge' }],
                page: 2,
                perPage: 100,
                role: 'copilot',
                total: 3,
                totalPages: 3,
            } as never)
            .mockResolvedValueOnce({
                challenges: [{ id: 'challenge-3', name: 'Oldest challenge' }],
                page: 3,
                perPage: 100,
                role: 'copilot',
                total: 3,
                totalPages: 3,
            } as never)

        const { result } = renderHook(
            () => useMemberRoleChallenges('tester', 'copilot'),
            { wrapper: TestSwrConfig },
        )

        await waitFor(() => expect(result.current.data?.challenges)
            .toHaveLength(1))

        expect(mockedXhrGetAsync)
            .toHaveBeenCalledTimes(1)
        expect(result.current.hasMore)
            .toBe(true)

        act(() => result.current.loadMore())

        await waitFor(() => expect(result.current.data?.challenges)
            .toHaveLength(2))
        expect(mockedXhrGetAsync)
            .toHaveBeenCalledTimes(2)

        act(() => result.current.loadMore())

        await waitFor(() => expect(result.current.data?.challenges)
            .toHaveLength(3))
        expect(result.current.hasMore)
            .toBe(false)

        const requestedUrls: string[] = mockedXhrGetAsync.mock.calls.map(call => call[0])

        expect(requestedUrls)
            .toEqual([
                expect.stringContaining('/members/tester/stats/roles/copilot/challenges?page=1&perPage=100'),
                expect.stringContaining('/members/tester/stats/roles/copilot/challenges?page=2&perPage=100'),
                expect.stringContaining('/members/tester/stats/roles/copilot/challenges?page=3&perPage=100'),
            ])
        expect(result.current.data)
            .toEqual({
                challenges: [
                    { id: 'challenge-1', name: 'Newest challenge' },
                    { id: 'challenge-2', name: 'Middle challenge' },
                    { id: 'challenge-3', name: 'Oldest challenge' },
                ],
                fulfillment: {
                    cancelled: 1,
                    completed: 2,
                    rate: 66.67,
                    total: 3,
                },
                role: 'copilot',
                total: 3,
                trackCounts: { DEVELOPMENT: 3 },
            })
    })

    it('does not request challenges until both handle and role are available', () => {
        renderHook(
            () => useMemberRoleChallenges('tester', undefined),
            { wrapper: TestSwrConfig },
        )

        expect(mockedXhrGetAsync)
            .not.toHaveBeenCalled()
    })

    it('keeps loaded challenges available when a later page fails', async () => {
        const loadError = new Error('Failed to load the next page')

        mockedXhrGetAsync
            .mockResolvedValueOnce({
                challenges: [{ id: 'challenge-1', name: 'Loaded challenge' }],
                page: 1,
                perPage: 100,
                role: 'reviewer',
                total: 2,
                totalPages: 2,
            } as never)
            .mockRejectedValueOnce(loadError)

        const { result } = renderHook(
            () => useMemberRoleChallenges('tester', 'reviewer'),
            { wrapper: TestSwrConfig },
        )

        await waitFor(() => expect(result.current.data?.challenges)
            .toHaveLength(1))

        act(() => result.current.loadMore())

        await waitFor(() => expect(result.current.error)
            .toBe(loadError))
        expect(result.current.data?.challenges)
            .toEqual([{ id: 'challenge-1', name: 'Loaded challenge' }])

        mockedXhrGetAsync.mockResolvedValueOnce({
            challenges: [{ id: 'challenge-2', name: 'Retried challenge' }],
            page: 2,
            perPage: 100,
            role: 'reviewer',
            total: 2,
            totalPages: 2,
        } as never)

        await act(async () => {
            await result.current.mutate()
        })

        await waitFor(() => expect(result.current.data?.challenges)
            .toHaveLength(2))
        expect(result.current.error)
            .toBeUndefined()
    })
})
