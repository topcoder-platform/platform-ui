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
    useLocation,
} from 'react-router-dom'
import { SWRConfig } from 'swr'

import {
    getMemberChallengeRegistrationIds,
    getOpportunityPage,
    getOpportunitySummary,
} from '../services'
import { OpportunitiesPage } from './OpportunitiesPage'

let mockProfileRoles: string[] = []
let mockSubdomain = 'platform-ui'

jest.mock('~/libs/core', () => ({
    useProfileContext: () => ({
        initialized: true,
        isLoggedIn: true,
        profile: { roles: mockProfileRoles, userId: 123 },
    }),
}), { virtual: true })

jest.mock('~/config', () => ({
    AppSubdomain: { opportunities: 'opportunities', topgear: 'topgear' },
    EnvironmentConfig: {
        get SUBDOMAIN(): string { return mockSubdomain },
        TOPCODER_URL: 'https://www.topcoder.example',
        TOPGEAR: { GROUP_ID: 'topgear-group-id' },
    },
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
    COMPLETED_ENGAGEMENTS_STATUS: 'COMPLETED',
    MY_ENGAGEMENTS_STATUS: 'MINE',
    OpportunityFiltersPanel: (props: {
        onAppliedChange: (checked: boolean) => void
        onStatusChange: (status: string) => void
    }) => {
        const selectMyCompetitions = (): void => props.onAppliedChange(true)
        const selectMyEngagements = (): void => props.onStatusChange('MINE')
        const selectCompletedEngagements = (): void => props.onStatusChange('COMPLETED')
        return (
            <aside aria-label='Opportunity filters'>
                <button onClick={selectMyCompetitions} type='button'>My competitions</button>
                <button onClick={selectMyEngagements} type='button'>My engagements</button>
                <button onClick={selectCompletedEngagements} type='button'>Completed engagements</button>
            </aside>
        )
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
    OpportunitySortSelect: () => <span>Sort choices</span>,
    OpportunityViewToggle: () => <span>View choices</span>,
    TopgearHero: () => <output data-testid='topgear-hero'>TopGear banner</output>,
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

const LocationProbe = (): JSX.Element => <output data-testid='location'>{useLocation().pathname}</output>

describe('OpportunitiesPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockProfileRoles = []
        mockSubdomain = 'platform-ui'
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

    it('does not restrict competitions to a community group outside the TopGear host', async () => {
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
                <MemoryRouter initialEntries={['/opportunities/competitions']}>
                    <Routes>
                        <Route element={<OpportunitiesPage />} path='/opportunities/:kind' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        await waitFor(() => expect(mockedGetOpportunityPage)
            .toHaveBeenCalledWith('competitions', expect.objectContaining({ groups: undefined })))
        expect(screen.queryByTestId('topgear-hero'))
            .not.toBeInTheDocument()
    })

    it('shows the TopGear banner and lists only the community group on the TopGear host', async () => {
        mockSubdomain = 'topgear'
        mockedGetOpportunityPage.mockResolvedValue({
            items: [{ id: 'topgear-challenge', name: 'TopGear challenge' }],
            page: 1,
            perPage: 10,
            total: 1,
            totalPages: 1,
        })

        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <MemoryRouter initialEntries={['/opportunities']}>
                    <Routes>
                        <Route element={<OpportunitiesPage />} path='/opportunities' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        expect(screen.getByTestId('topgear-hero'))
            .toBeInTheDocument()
        expect(screen.queryByTestId('competition-count'))
            .not.toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Browse Competitions' }))
            .toBeInTheDocument()
        await waitFor(() => expect(mockedGetOpportunityPage)
            .toHaveBeenCalledWith('competitions', expect.objectContaining({
                groups: ['topgear-group-id'],
                statuses: ['ACTIVE'],
            })))
        expect(await screen.findByTestId('registration-topgear-challenge'))
            .toBeInTheDocument()
        expect(mockedGetOpportunitySummary)
            .not.toHaveBeenCalled()
    })

    it('sends other opportunity categories back to the competition listing on the TopGear host', async () => {
        mockSubdomain = 'topgear'
        mockedGetOpportunityPage.mockResolvedValue({
            items: [],
            page: 1,
            perPage: 10,
            total: 0,
            totalPages: 0,
        })

        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <MemoryRouter initialEntries={['/opportunities/engagements?search=React']}>
                    <LocationProbe />
                    <Routes>
                        <Route element={<OpportunitiesPage />} path='/opportunities' />
                        <Route element={<OpportunitiesPage />} path='/opportunities/:kind' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        await waitFor(() => expect(screen.getByTestId('location'))
            .toHaveTextContent('/opportunities'))
        await waitFor(() => expect(mockedGetOpportunityPage)
            .toHaveBeenCalledWith('competitions', expect.anything()))
        expect(mockedGetOpportunityPage)
            .not.toHaveBeenCalledWith('engagements', expect.anything())
        expect(mockedGetOpportunitySummary)
            .not.toHaveBeenCalled()
    })

    it('places mobile sorting controls after the filters and before results', async () => {
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
                <MemoryRouter initialEntries={['/opportunities/competitions']}>
                    <Routes>
                        <Route element={<OpportunitiesPage />} path='/opportunities/:kind' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        const filters = screen.getByRole('complementary', { name: 'Opportunity filters' })
        const sort = screen.getByText('Sort choices')
        const results = await screen.findByText('No results found')
        expect(filters.compareDocumentPosition(sort))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
        expect(sort.compareDocumentPosition(results))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    })

    it('hydrates the competition search from a linked skill query', async () => {
        mockedGetOpportunitySummary.mockResolvedValue({
            competitions: { count: 1 },
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
                <MemoryRouter initialEntries={['/opportunities/competitions?search=IBM%20Bluemix']}>
                    <Routes>
                        <Route element={<OpportunitiesPage />} path='/opportunities/:kind' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        await waitFor(() => expect(mockedGetOpportunityPage)
            .toHaveBeenCalledWith('competitions', expect.objectContaining({ search: 'IBM Bluemix' })))
    })

    it('hydrates review search from a clicked tag or skill query', async () => {
        mockedGetOpportunitySummary.mockResolvedValue({
            competitions: { count: 0 },
            copilots: { count: 0 },
            engagements: { count: 0 },
            reviews: { count: 1 },
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
                <MemoryRouter initialEntries={['/opportunities/reviews?search=UICollectionView']}>
                    <Routes>
                        <Route element={<OpportunitiesPage />} path='/opportunities/:kind' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        await waitFor(() => expect(mockedGetOpportunityPage)
            .toHaveBeenCalledWith('reviews', expect.objectContaining({ search: 'UICollectionView' })))
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

    it('lists every owned engagement lifecycle behind the My engagements status', async () => {
        mockedGetOpportunitySummary.mockResolvedValue({
            competitions: { count: 0 },
            copilots: { count: 0 },
            engagements: { count: 2 },
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
                <MemoryRouter initialEntries={['/opportunities/engagements']}>
                    <Routes>
                        <Route element={<OpportunitiesPage />} path='/opportunities/:kind' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        await waitFor(() => expect(mockedGetOpportunityPage)
            .toHaveBeenLastCalledWith('engagements', expect.objectContaining({
                applied: false,
                statuses: ['OPEN'],
            })))

        fireEvent.click(screen.getByRole('button', { name: 'My engagements' }))

        await waitFor(() => expect(mockedGetOpportunityPage)
            .toHaveBeenLastCalledWith('engagements', expect.objectContaining({
                applied: true,
                statuses: undefined,
            })))
    })

    it('scopes the Completed engagements status to the signed-in member', async () => {
        mockedGetOpportunitySummary.mockResolvedValue({
            competitions: { count: 0 },
            copilots: { count: 0 },
            engagements: { count: 2 },
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
                <MemoryRouter initialEntries={['/opportunities/engagements']}>
                    <Routes>
                        <Route element={<OpportunitiesPage />} path='/opportunities/:kind' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        await waitFor(() => expect(mockedGetOpportunityPage)
            .toHaveBeenCalledWith('engagements', expect.anything()))

        fireEvent.click(screen.getByRole('button', { name: 'Completed engagements' }))

        await waitFor(() => expect(mockedGetOpportunityPage)
            .toHaveBeenLastCalledWith('engagements', expect.objectContaining({
                applied: true,
                statuses: ['COMPLETED'],
            })))
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
