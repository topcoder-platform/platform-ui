/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { PropsWithChildren } from 'react'
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { SWRConfig } from 'swr'

import { fetchChallenges } from '../services'

import { useFetchChallenges, UseFetchChallengesResult } from './useFetchChallenges'

jest.mock('../constants', () => ({
    PAGE_SIZE: 10,
}))
jest.mock('../services', () => ({
    fetchChallenges: jest.fn(),
}))

const mockedFetchChallenges = fetchChallenges as jest.MockedFunction<typeof fetchChallenges>

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

interface TestComponentProps {
    enabled?: boolean
}

const TestComponent = (props: TestComponentProps): JSX.Element => {
    const { metadata }: UseFetchChallengesResult = useFetchChallenges({
        enabled: props.enabled,
        memberId: 12345,
        page: 2,
        perPage: 25,
    })

    return <div>{metadata.page}</div>
}

describe('useFetchChallenges', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('passes memberId through to the challenge fetcher when provided', async () => {
        const cache = new Map<string, unknown>()
        const wrapper = createWrapper(cache)

        mockedFetchChallenges.mockResolvedValue({
            data: [],
            metadata: {
                page: 2,
                perPage: 25,
                total: 0,
                totalPages: 0,
            },
        })

        render(<TestComponent />, {
            wrapper,
        })

        await waitFor(() => {
            expect(mockedFetchChallenges)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        memberId: 12345,
                    }),
                    expect.objectContaining({
                        page: 2,
                        perPage: 25,
                    }),
                )
        })
        await waitFor(() => {
            expect(screen.getByText('2'))
                .toBeTruthy()
        })
    })

    it('does not fetch challenges when disabled', async () => {
        const cache = new Map<string, unknown>()
        const wrapper = createWrapper(cache)

        render(<TestComponent enabled={false} />, {
            wrapper,
        })

        await waitFor(() => {
            expect(screen.getByText('2'))
                .toBeTruthy()
        })

        expect(mockedFetchChallenges)
            .not.toHaveBeenCalled()
    })
})
