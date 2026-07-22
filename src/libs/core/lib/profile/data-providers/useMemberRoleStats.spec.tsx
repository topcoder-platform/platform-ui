/* eslint-disable @typescript-eslint/typedef, import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { FC, ReactNode } from 'react'

import { renderHook, waitFor } from '@testing-library/react'
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
    ): string => `https://api.example.com/members/${handle}/stats/roles/${role}/challenges`,
    memberRoleStatsURL: (handle: string): string => `https://api.example.com/members/${handle}/stats/roles`,
}))

const mockedXhrGetAsync = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>

const TestSwrConfig: FC<{ children: ReactNode }> = props => (
    <SWRConfig
        value={{
            dedupingInterval: 0,
            fetcher: (url: string) => xhrGetAsync(url),
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

    it('loads the complete challenge history in one unpaginated request', async () => {
        const challenges = Array.from({ length: 101 }, (_value, index) => ({
            id: `challenge-${index + 1}`,
            name: `Challenge ${index + 1}`,
        }))

        mockedXhrGetAsync.mockResolvedValueOnce({
            challenges,
            fulfillment: {
                cancelled: 1,
                completed: 100,
                rate: 99.01,
                total: 101,
            },
            role: 'copilot',
            total: 101,
            trackCounts: { DEVELOPMENT: 101 },
        } as never)

        const { result } = renderHook(
            () => useMemberRoleChallenges('tester', 'copilot'),
            { wrapper: TestSwrConfig },
        )

        await waitFor(() => expect(result.current.data?.challenges)
            .toHaveLength(101))

        expect(mockedXhrGetAsync)
            .toHaveBeenCalledTimes(1)
        expect(mockedXhrGetAsync)
            .toHaveBeenCalledWith('https://api.example.com/members/tester/stats/roles/copilot/challenges')
        expect(result.current.data?.challenges[100])
            .toEqual({ id: 'challenge-101', name: 'Challenge 101' })
    })

    it('does not request challenges until both handle and role are available', () => {
        renderHook(
            () => useMemberRoleChallenges('tester', undefined),
            { wrapper: TestSwrConfig },
        )

        expect(mockedXhrGetAsync)
            .not.toHaveBeenCalled()
    })
})
