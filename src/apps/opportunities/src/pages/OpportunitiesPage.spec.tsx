/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import '@testing-library/jest-dom'
import React from 'react'
import {
    fireEvent,
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
    getMemberChallengeRegistrationIds,
    getOpportunityPage,
    getOpportunitySummary,
} from '../services'
import { OpportunitiesPage } from './OpportunitiesPage'

let mockProfileRoles: string[] = []

jest.mock('~/libs/core', () => ({
    useProfileContext: () => ({
        initialized: true,
        isLoggedIn: true,
        profile: { roles: mockProfileRoles, userId: 123 },
    }),
}), { virtual: true })

jest.mock('~/config', () => ({
    EnvironmentConfig: { TOPCODER_URL: 'https://www.topcoder.example' },
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
    OpportunityFiltersPanel: (props: { onAppliedChange: (checked: boolean) => void }) => {
        const selectMyCompetitions = (): void => props.onAppliedChange(true)
        return <button onClick={selectMyCompetitions} type='button'>My competitions</button>
    },
    OpportunityHero: (props: { summary?: { competitions?: { count?: number } } }) => (
        <output data-testid='competition-count'>
            {props.summary?.competitions?.count ?? 'pending'}
        </output>
    ),
    OpportunityListCard: (props: { item: { id: string }; registered?: boolean }) => (
        <output data-testid={`registration-${props.item.id}`}>{String(!!props.registered)}</output>
    ),
    OpportunityPagination: (props: { onPageChange: (page: number) => void }) => (
        <button aria-label='Go to page 2' onClick={() => props.onPageChange(2)} type='button' />
    ),
    OpportunitySortSelect: () => undefined,
    OpportunityViewToggle: () => undefined,
}))

jest.mock('../services', () => ({
    getMemberChallengeRegistrationIds: jest.fn(),
    getOpportunityPage: jest.fn(),
    getOpportunitySummary: jest.fn(),
}))

const mockedGetOpportunityPage = getOpportunityPage as jest.MockedFunction<typeof getOpportunityPage>
const mockedGetOpportunitySummary = getOpportunitySummary as jest.MockedFunction<typeof getOpportunitySummary>
const mockedGetRegistrationIds = getMemberChallengeRegistrationIds as jest.MockedFunction<
    typeof getMemberChallengeRegistrationIds
>

describe('OpportunitiesPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockProfileRoles = []
        mockedGetRegistrationIds.mockResolvedValue([])
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

    it('shows registration state on competition cards outside My competitions', async () => {
        mockedGetOpportunitySummary.mockResolvedValue({
            competitions: { count: 1 },
            copilots: { count: 0 },
            engagements: { count: 0 },
            reviews: { count: 0 },
        })
        mockedGetOpportunityPage.mockResolvedValue({
            items: [{ id: 'challenge-id', name: 'Registered challenge' }],
            page: 1,
            perPage: 10,
            total: 1,
            totalPages: 1,
        })
        mockedGetRegistrationIds.mockResolvedValue(['challenge-id'])

        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <MemoryRouter initialEntries={['/opportunities/competitions']}>
                    <Routes>
                        <Route element={<OpportunitiesPage />} path='/opportunities/:kind' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        await waitFor(() => expect(screen.getByTestId('registration-challenge-id'))
            .toHaveTextContent('true'))
    })

    it('scrolls to the top when the member selects another results page', async () => {
        const scrollTo = jest.spyOn(window, 'scrollTo')
            .mockImplementation()
        mockedGetOpportunitySummary.mockResolvedValue({
            competitions: { count: 20 },
            copilots: { count: 0 },
            engagements: { count: 0 },
            reviews: { count: 0 },
        })
        mockedGetOpportunityPage.mockResolvedValue({
            items: [{ id: 'challenge-id', name: 'Challenge' }],
            page: 1,
            perPage: 10,
            total: 20,
            totalPages: 2,
        })

        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <MemoryRouter initialEntries={['/opportunities/competitions']}>
                    <Routes>
                        <Route element={<OpportunitiesPage />} path='/opportunities/:kind' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        fireEvent.click((await screen.findAllByRole('button', { name: 'Go to page 2' }))[0])

        expect(scrollTo)
            .toHaveBeenCalledWith({ left: 0, top: 0 })
        await waitFor(() => expect(mockedGetOpportunityPage)
            .toHaveBeenLastCalledWith('competitions', expect.objectContaining({ page: 2 })))
        scrollTo.mockRestore()
    })

    it('does not label a non-submitter My competition as registered', async () => {
        mockedGetOpportunitySummary.mockResolvedValue({
            competitions: { count: 1 },
            copilots: { count: 0 },
            engagements: { count: 0 },
            reviews: { count: 0 },
        })
        mockedGetOpportunityPage.mockResolvedValue({
            items: [{ id: 'managed-challenge', name: 'Managed challenge' }],
            page: 1,
            perPage: 10,
            total: 1,
            totalPages: 1,
        })

        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <MemoryRouter initialEntries={['/opportunities/competitions']}>
                    <Routes>
                        <Route element={<OpportunitiesPage />} path='/opportunities/:kind' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        fireEvent.click(screen.getByRole('button', { name: 'My competitions' }))
        await waitFor(() => expect(mockedGetOpportunityPage)
            .toHaveBeenLastCalledWith('competitions', expect.objectContaining({ applied: true })))
        expect(await screen.findByTestId('registration-managed-challenge'))
            .toHaveTextContent('false')
    })

    it('links the copilot learning card to the published Thrive article', async () => {
        mockedGetOpportunitySummary.mockResolvedValue({
            competitions: { count: 0 },
            copilots: { count: 0 },
            engagements: { count: 0 },
            reviews: { count: 0 },
        })
        mockedGetOpportunityPage.mockResolvedValue({
            items: [],
            page: 1,
            perPage: 10,
            total: 0,
            totalPages: 0,
        })

        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <MemoryRouter initialEntries={['/opportunities/copilots']}>
                    <Routes>
                        <Route element={<OpportunitiesPage />} path='/opportunities/:kind' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        expect(await screen.findByRole('link', { name: /learn more/i }))
            .toHaveAttribute(
                'href',
                'https://www.topcoder.example/thrive/articles/become-a-copilot-at-topcoder',
            )
        expect(screen.getByRole('link', { name: /learn more/i }))
            .toHaveAttribute('target', '_blank')
        expect(screen.getByRole('link', { name: /learn more/i }))
            .toHaveAttribute('rel', 'noreferrer')
    })

    it('keeps reviewer learning content visible after reviewer profile hydration', async () => {
        mockProfileRoles = ['Reviewer']
        mockedGetOpportunitySummary.mockResolvedValue({
            competitions: { count: 0 },
            copilots: { count: 0 },
            engagements: { count: 0 },
            reviews: { count: 0 },
        })
        mockedGetOpportunityPage.mockResolvedValue({
            items: [],
            page: 1,
            perPage: 10,
            total: 0,
            totalPages: 0,
        })

        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <MemoryRouter initialEntries={['/opportunities/reviews']}>
                    <Routes>
                        <Route element={<OpportunitiesPage />} path='/opportunities/:kind' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        expect(await screen.findByRole('heading', { name: 'How to become a reviewer?' }))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: /learn more/i }))
            .toHaveAttribute(
                'href',
                'https://www.topcoder.example/thrive/articles/Reviewer%20Qualification%20Requirements',
            )
        expect(screen.getByRole('link', { name: /learn more/i }))
            .toHaveAttribute('target', '_blank')
        expect(screen.getByRole('link', { name: /learn more/i }))
            .toHaveAttribute('rel', 'noreferrer')
    })
})
