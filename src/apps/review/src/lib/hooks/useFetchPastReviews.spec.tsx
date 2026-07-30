/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import { fetchPastReviews } from '../services'

import {
    DEFAULT_PAST_REVIEWS_PER_PAGE,
    useFetchPastReviews,
    useFetchPastReviewsProps,
} from './useFetchPastReviews'

jest.mock('~/libs/shared', () => ({
    handleError: jest.fn(),
}), { virtual: true })

jest.mock('../services', () => ({
    fetchPastReviews: jest.fn(),
}))

jest.mock('./useFetchActiveReviews', () => ({
    transformAssignments: jest.fn()
        .mockReturnValue([]),
}))

const mockedFetchPastReviews = fetchPastReviews as jest.Mock
const reviewerRoleIds: string[] = [
    'reviewer-role',
    'screening-role',
]

const TestComponent = (): JSX.Element => {
    const {
        isLoading,
        loadPastReviews,
    }: useFetchPastReviewsProps = useFetchPastReviews()

    function loadReviewerChallenges(): void {
        loadPastReviews({
            page: 1,
            perPage: DEFAULT_PAST_REVIEWS_PER_PAGE,
            resourceRoleIds: reviewerRoleIds,
        })
            .catch(() => undefined)
    }

    function loadNextPage(): void {
        loadPastReviews({
            page: 2,
            perPage: DEFAULT_PAST_REVIEWS_PER_PAGE,
        })
            .catch(() => undefined)
    }

    function clearRoleFilter(): void {
        loadPastReviews({
            page: 1,
            perPage: DEFAULT_PAST_REVIEWS_PER_PAGE,
            resourceRoleIds: undefined,
        })
            .catch(() => undefined)
    }

    return (
        <>
            <button onClick={loadReviewerChallenges} type='button'>
                Load reviewer challenges
            </button>
            <button onClick={loadNextPage} type='button'>
                Load next page
            </button>
            <button onClick={clearRoleFilter} type='button'>
                Clear role filter
            </button>
            <div data-testid='loading'>
                {String(isLoading)}
            </div>
        </>
    )
}

describe('useFetchPastReviews role filter', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedFetchPastReviews.mockResolvedValue({
            data: [],
            meta: {
                page: 1,
                perPage: DEFAULT_PAST_REVIEWS_PER_PAGE,
                totalCount: 0,
                totalPages: 0,
            },
        })
    })

    it('persists reviewer role IDs across page changes and supports an explicit clear', async () => {
        render(<TestComponent />)
        const loadingIndicator = screen.getByTestId('loading')

        fireEvent.click(screen.getByRole('button', {
            name: 'Load reviewer challenges',
        }))
        await waitFor(() => {
            expect(loadingIndicator.textContent)
                .toBe('false')
        })
        expect(mockedFetchPastReviews)
            .toHaveBeenCalledTimes(1)
        expect(mockedFetchPastReviews)
            .toHaveBeenNthCalledWith(1, expect.objectContaining({
                page: 1,
                resourceRoleIds: reviewerRoleIds,
            }))

        fireEvent.click(screen.getByRole('button', {
            name: 'Load next page',
        }))
        await waitFor(() => {
            expect(loadingIndicator.textContent)
                .toBe('false')
        })
        expect(mockedFetchPastReviews)
            .toHaveBeenCalledTimes(2)
        expect(mockedFetchPastReviews)
            .toHaveBeenNthCalledWith(2, expect.objectContaining({
                page: 2,
                resourceRoleIds: reviewerRoleIds,
            }))

        fireEvent.click(screen.getByRole('button', {
            name: 'Clear role filter',
        }))
        await waitFor(() => {
            expect(loadingIndicator.textContent)
                .toBe('false')
        })
        expect(mockedFetchPastReviews)
            .toHaveBeenCalledTimes(3)
        expect(mockedFetchPastReviews)
            .toHaveBeenNthCalledWith(3, expect.objectContaining({
                page: 1,
                resourceRoleIds: undefined,
            }))
    })
})
