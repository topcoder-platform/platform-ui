/* eslint-disable import/no-extraneous-dependencies, react/jsx-no-bind */
import {
    MemoryRouter,
    Route,
    Routes,
    useLocation,
} from 'react-router-dom'

import {
    fireEvent,
    render,
    RenderResult,
    screen,
} from '@testing-library/react'
import '@testing-library/jest-dom'

import { useHomeChallengeFeed } from '../hooks/use-home-challenge-feed'

import { HomeChallengesFeed } from './HomeChallengesFeed'

let mockProfile: { userId: number } | undefined = { userId: 123 }

jest.mock('~/libs/core', () => ({
    useProfileContext: () => ({ initialized: true, profile: mockProfile }),
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        IconOutline: new Proxy({}, {
            get: () => Icon,
        }),
    }
}, { virtual: true })

jest.mock('../hooks/use-home-challenge-feed', () => ({
    useHomeChallengeFeed: jest.fn(),
}))

jest.mock('./OpportunityListCard', () => ({
    OpportunityListCard: (props: {
        item: { id: string; name: string }
        kind: string
        onSkillClick?: (skill: string) => void
        registered?: boolean
        view?: string
    }) => (
        <article data-testid={`card-${props.item.id}`}>
            {`${props.item.name} ${props.kind} ${props.view} registered=${String(!!props.registered)}`}
            <button onClick={() => props.onSkillClick?.('React JS')} type='button'>
                {`Skill for ${props.item.id}`}
            </button>
        </article>
    ),
}))

const mockedUseHomeChallengeFeed = useHomeChallengeFeed as jest.MockedFunction<typeof useHomeChallengeFeed>

const LocationProbe = (): JSX.Element => {
    const location = useLocation()
    return <output data-testid='location'>{`${location.pathname}${location.search}`}</output>
}

/**
 * Renders the feed inside a router that records navigation.
 *
 * @returns render result.
 */
function renderFeed(): RenderResult {
    return render(
        <MemoryRouter initialEntries={['/opportunities/home']}>
            <Routes>
                <Route
                    element={<HomeChallengesFeed listingRoute='/opportunities/competitions' />}
                    path='/opportunities/home'
                />
                <Route element={<LocationProbe />} path='*' />
            </Routes>
        </MemoryRouter>,
    )
}

describe('HomeChallengesFeed', () => {
    const retry = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        mockProfile = { userId: 123 }
    })

    it('renders shared competition cards with the member registration state', () => {
        mockedUseHomeChallengeFeed.mockReturnValue({
            challenges: [
                { id: 'registered', name: 'Registered challenge' },
                { id: 'open', name: 'Open challenge' },
            ],
            loading: false,
            registeredIds: new Set(['registered']),
            retry,
        })

        renderFeed()

        expect(mockedUseHomeChallengeFeed)
            .toHaveBeenCalledWith('123')
        expect(screen.getByRole('heading', { name: 'Opportunities' }))
            .toBeInTheDocument()
        expect(screen.getByTestId('card-registered'))
            .toHaveTextContent('Registered challenge competitions list registered=true')
        expect(screen.getByTestId('card-open'))
            .toHaveTextContent('Open challenge competitions list registered=false')
    })

    it('links View all and card skills to Browse Competitions', () => {
        mockedUseHomeChallengeFeed.mockReturnValue({
            challenges: [{ id: 'open', name: 'Open challenge' }],
            loading: false,
            registeredIds: new Set(),
            retry,
        })

        renderFeed()

        expect(screen.getByRole('link', { name: 'View all' }))
            .toHaveAttribute('href', '/opportunities/competitions')
        fireEvent.click(screen.getByRole('button', { name: 'Skill for open' }))
        expect(screen.getByTestId('location'))
            .toHaveTextContent('/opportunities/competitions?search=React+JS')
    })

    it('waits for the profile before requesting registrations', () => {
        mockProfile = undefined
        mockedUseHomeChallengeFeed.mockReturnValue({
            challenges: [],
            loading: true,
            registeredIds: new Set(),
            retry,
        })

        renderFeed()

        expect(mockedUseHomeChallengeFeed)
            .toHaveBeenCalledWith(undefined)
        expect(screen.getByRole('status', { name: 'Loading opportunities' }))
            .toBeInTheDocument()
    })

    it('offers a retry after a failure and an empty state when nothing is open', () => {
        mockedUseHomeChallengeFeed.mockReturnValue({
            challenges: [],
            error: new Error('Service unavailable'),
            loading: false,
            registeredIds: new Set(),
            retry,
        })

        const { unmount }: RenderResult = renderFeed()

        expect(screen.getByRole('alert'))
            .toHaveTextContent('We couldn\'t load opportunities.')
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
        expect(retry)
            .toHaveBeenCalledTimes(1)
        unmount()

        mockedUseHomeChallengeFeed.mockReturnValue({
            challenges: [],
            loading: false,
            registeredIds: new Set(),
            retry,
        })
        renderFeed()

        expect(screen.getByText('No open competitions right now'))
            .toBeInTheDocument()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
})
