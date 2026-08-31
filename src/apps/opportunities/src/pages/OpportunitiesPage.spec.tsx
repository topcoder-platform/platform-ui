/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'
import { SWRConfig } from 'swr'

import { getOpportunityPage, getOpportunitySummary } from '../services'
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
    OpportunityFiltersPanel: () => undefined,
    OpportunityHero: (props: { summary?: { competitions?: { count?: number } } }) => (
        <output data-testid='competition-count'>
            {props.summary?.competitions?.count ?? 'pending'}
        </output>
    ),
    OpportunityListCard: () => undefined,
    OpportunityPagination: () => undefined,
    OpportunityViewToggle: () => undefined,
}))

jest.mock('../services', () => ({
    getOpportunityPage: jest.fn(),
    getOpportunitySummary: jest.fn(),
}))

const mockedGetOpportunityPage = getOpportunityPage as jest.MockedFunction<typeof getOpportunityPage>
const mockedGetOpportunitySummary = getOpportunitySummary as jest.MockedFunction<typeof getOpportunitySummary>

describe('OpportunitiesPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('loads the public category summary without a separate destination tab', async () => {
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

        expect(screen.getByTestId('competition-count'))
            .toHaveTextContent('pending')
        await waitFor(() => expect(screen.getByTestId('competition-count'))
            .toHaveTextContent('1'))
        expect(mockedGetOpportunitySummary)
            .toHaveBeenCalledTimes(1)
    })
})
