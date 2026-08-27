/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import React from 'react'
import {
    act,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'
import { SWRConfig } from 'swr'

import {
    getMyWorkCounts,
    getOpportunityPage,
    getOpportunitySummary,
} from '../services'
import { OpportunitiesPage } from './OpportunitiesPage'

jest.mock('~/libs/core', () => ({
    useProfileContext: () => ({
        initialized: true,
        isLoggedIn: true,
        profile: { roles: [], userId: 123 },
    }),
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const Icon = (): undefined => undefined
    return {
        IconOutline: new Proxy({}, {
            get: () => Icon,
        }),
    }
}, { virtual: true })

jest.mock('../components', () => ({
    MyWorkListing: () => undefined,
    OpportunityFiltersPanel: () => undefined,
    OpportunityHero: (props: { mode: string; workCount?: number }) => (
        <output data-mode={props.mode} data-testid='work-count'>
            {props.workCount ?? 'pending'}
        </output>
    ),
    OpportunityListCard: () => undefined,
    OpportunityPagination: () => undefined,
    OpportunityViewToggle: () => undefined,
}))

jest.mock('../services', () => ({
    getMyWorkCounts: jest.fn(),
    getOpportunityPage: jest.fn(),
    getOpportunitySummary: jest.fn(),
}))

const mockedGetMyWorkCounts = getMyWorkCounts as jest.MockedFunction<typeof getMyWorkCounts>
const mockedGetOpportunityPage = getOpportunityPage as jest.MockedFunction<typeof getOpportunityPage>
const mockedGetOpportunitySummary = getOpportunitySummary as jest.MockedFunction<typeof getOpportunitySummary>

describe('OpportunitiesPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('loads and displays the real My Work total while Browse is selected', async () => {
        let resolveCounts!: (counts: Awaited<ReturnType<typeof getMyWorkCounts>>) => void
        mockedGetMyWorkCounts.mockReturnValue(new Promise(resolve => {
            resolveCounts = resolve
        }))
        mockedGetOpportunitySummary.mockResolvedValue({
            competitions: { count: 1 },
            copilots: { count: 1 },
            engagements: { count: 1 },
            reviews: { count: 1 },
        })
        mockedGetOpportunityPage.mockResolvedValue({
            items: [],
            page: 1,
            perPage: 10,
            total: 0,
            totalPages: 0,
        })
        const cache = new Map()

        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => cache }}>
                <MemoryRouter initialEntries={['/opportunities/competitions']}>
                    <Routes>
                        <Route element={<OpportunitiesPage />} path='/opportunities/:kind' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        expect(screen.getByTestId('work-count'))
            .toHaveAttribute('data-mode', 'browse')
        expect(screen.getByTestId('work-count'))
            .toHaveTextContent('pending')
        expect(screen.getByTestId('work-count'))
            .not.toHaveTextContent('3')
        await waitFor(() => expect(mockedGetMyWorkCounts)
            .toHaveBeenCalledWith('123'))

        await act(async () => resolveCounts({
            competitions: 40,
            copilots: 20,
            engagements: 30,
            reviews: 15,
        }))

        await waitFor(() => expect(screen.getByTestId('work-count'))
            .toHaveTextContent('105'))
        expect(screen.getByTestId('work-count'))
            .toHaveAttribute('data-mode', 'browse')
    })
})
