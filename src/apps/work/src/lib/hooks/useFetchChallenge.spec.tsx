/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { PropsWithChildren } from 'react'
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { SWRConfig } from 'swr'

import { fetchChallenge } from '../services'

import {
    useFetchChallenge,
    UseFetchChallengeResult,
} from './useFetchChallenge'

jest.mock('../services', () => ({
    fetchChallenge: jest.fn(),
}))

const mockedFetchChallenge = fetchChallenge as jest.MockedFunction<typeof fetchChallenge>

function createWrapper(cache: Map<string, unknown>) {
    return function Wrapper(props: PropsWithChildren): JSX.Element {
        return (
            <SWRConfig value={{
                provider: () => cache,
                revalidateOnFocus: false,
                revalidateOnMount: true,
            }}
            >
                {props.children}
            </SWRConfig>
        )
    }
}

const TestComponent = (): JSX.Element => {
    const { challenge }: UseFetchChallengeResult = useFetchChallenge('challenge-1')

    return (
        <div>{challenge?.name || 'Loading'}</div>
    )
}

describe('useFetchChallenge', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('revalidates immediately when a cached challenge is remounted', async () => {
        const cache = new Map<string, unknown>()
        const wrapper = createWrapper(cache)

        mockedFetchChallenge.mockResolvedValue({
            id: 'challenge-1',
            name: 'Updated challenge',
        } as never)

        const firstRender = render(<TestComponent />, {
            wrapper,
        })

        await waitFor(() => {
            expect(mockedFetchChallenge)
                .toHaveBeenCalledTimes(1)
        })
        await waitFor(() => {
            expect(screen.getByText('Updated challenge'))
                .toBeTruthy()
        })

        firstRender.unmount()

        await new Promise(resolve => {
            setTimeout(resolve, 0)
        })

        render(<TestComponent />, {
            wrapper,
        })

        await waitFor(() => {
            expect(mockedFetchChallenge)
                .toHaveBeenCalledTimes(2)
        })
    })
})
