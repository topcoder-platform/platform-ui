/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { PropsWithChildren } from 'react'
import {
    fireEvent,
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

const AppendResultsTestComponent = (): JSX.Element => {
    const {
        challenges,
        mutate,
    }: UseFetchChallengesResult = useFetchChallenges({
        appendResults: true,
        page: 1,
        perPage: 25,
    })
    const challengeNames: string = challenges.map(challenge => challenge.name)
        .join(', ')

    function handleRefresh(): void {
        mutate()
            .catch(() => undefined)
    }

    return (
        <>
            <button onClick={handleRefresh} type='button'>
                Refresh
            </button>
            <div>{challengeNames || 'No challenges'}</div>
        </>
    )
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

    it('removes omitted challenges from appended results after a same-page refresh', async () => {
        const cache = new Map<string, unknown>()
        const wrapper = createWrapper(cache)

        mockedFetchChallenges
            .mockResolvedValueOnce({
                data: [
                    { id: 'visible-challenge', name: 'Visible Challenge' },
                    { id: 'restricted-challenge', name: 'Restricted Challenge' },
                ],
                metadata: {
                    page: 1,
                    perPage: 25,
                    total: 2,
                    totalPages: 1,
                },
            } as never)
            .mockResolvedValueOnce({
                data: [
                    { id: 'visible-challenge', name: 'Visible Challenge' },
                ],
                metadata: {
                    page: 1,
                    perPage: 25,
                    total: 1,
                    totalPages: 1,
                },
            } as never)

        render(<AppendResultsTestComponent />, {
            wrapper,
        })

        await waitFor(() => {
            expect(screen.getByText(/Restricted Challenge/))
                .toBeTruthy()
        })

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

        await waitFor(() => {
            expect(screen.queryByText(/Restricted Challenge/))
                .toBeNull()
        })
        expect(screen.getByText('Visible Challenge'))
            .toBeTruthy()
    })

    it('does not return cached challenges when a fresh fetch errors', async () => {
        const cache = new Map<string, unknown>()
        const wrapper = createWrapper(cache)

        mockedFetchChallenges
            .mockResolvedValueOnce({
                data: [
                    { id: 'restricted-challenge', name: 'Restricted Challenge' },
                ],
                metadata: {
                    page: 1,
                    perPage: 25,
                    total: 1,
                    totalPages: 1,
                },
            } as never)
            .mockRejectedValueOnce(new Error('Forbidden'))

        render(<AppendResultsTestComponent />, {
            wrapper,
        })

        await waitFor(() => {
            expect(screen.getByText('Restricted Challenge'))
                .toBeTruthy()
        })

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

        await waitFor(() => {
            expect(screen.queryByText('Restricted Challenge'))
                .toBeNull()
        })
        expect(screen.getByText('No challenges'))
            .toBeTruthy()
    })
})
