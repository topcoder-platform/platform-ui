/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import {
    fetchActiveReviews,
} from '../services'

import { useFetchActiveReviews } from './useFetchActiveReviews'
import type { useFetchActiveReviewsProps } from './useFetchActiveReviews'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        REVIEW: {
            PROFILE_PAGE_URL: 'https://profiles.example.com',
        },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn()
        .mockReturnValue('#000000'),
}), { virtual: true })

jest.mock('~/libs/shared', () => ({
    handleError: jest.fn(),
}), { virtual: true })

jest.mock('../services', () => ({
    fetchActiveReviews: jest.fn(),
}))

const mockedFetchActiveReviews = fetchActiveReviews as jest.Mock

const TestComponent = (): JSX.Element => {
    const {
        activeReviews,
        loadActiveReviews,
    }: useFetchActiveReviewsProps = useFetchActiveReviews()
    const reviewNames: string = activeReviews.map(review => review.name)
        .join(', ')

    function handleLoad(): void {
        loadActiveReviews({
            page: 1,
            perPage: 50,
        })
            .catch(() => undefined)
    }

    return (
        <>
            <button
                onClick={handleLoad}
                type='button'
            >
                Load
            </button>
            <div>{reviewNames || 'No active reviews'}</div>
        </>
    )
}

describe('useFetchActiveReviews', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('clears cached review assignments when a fresh load errors', async () => {
        mockedFetchActiveReviews
            .mockResolvedValueOnce({
                data: [
                    {
                        challengeId: 'challenge-1',
                        challengeName: 'Restricted Challenge',
                        status: 'ACTIVE',
                    },
                ],
                meta: {
                    page: 1,
                    perPage: 50,
                    totalCount: 1,
                    totalPages: 1,
                },
            } as never)
            .mockRejectedValueOnce(new Error('Forbidden'))

        render(<TestComponent />)

        fireEvent.click(screen.getByRole('button', { name: 'Load' }))

        await waitFor(() => {
            expect(screen.getByText('Restricted Challenge'))
                .toBeTruthy()
        })

        fireEvent.click(screen.getByRole('button', { name: 'Load' }))

        await waitFor(() => {
            expect(screen.queryByText('Restricted Challenge'))
                .toBeNull()
        })
        expect(screen.getByText('No active reviews'))
            .toBeTruthy()
    })
})
