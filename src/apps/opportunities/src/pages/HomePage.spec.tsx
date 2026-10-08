/* eslint-disable import/no-extraneous-dependencies */
import {
    MemoryRouter,
    Route,
    Routes,
    useLocation,
} from 'react-router-dom'

import { render, RenderResult, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { HomePage } from './HomePage'

let mockSubdomain = 'platform-ui'
let mockDomain = 'topcoder-dev.com'

jest.mock('~/config', () => ({
    AppSubdomain: { opportunities: 'opportunities', topgear: 'topgear' },
    EnvironmentConfig: {
        get SUBDOMAIN(): string { return mockSubdomain },
        get TC_DOMAIN(): string { return mockDomain },
    },
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    PageTitle: (props: { children: string }) => <output data-testid='page-title'>{props.children}</output>,
}), { virtual: true })

jest.mock('../opportunities.routes', () => ({
    rootRoute: '/opportunities',
}))

jest.mock('../components', () => ({
    HomeChallengesFeed: (props: { listingRoute: string }) => (
        <section data-testid='feed'>{props.listingRoute}</section>
    ),
    HomeCmsViewport: (props: { label: string; variant: string; viewportId: string }) => (
        <section data-testid={`cms-${props.viewportId}`}>{`${props.label} ${props.variant}`}</section>
    ),
    HomeTopcoderTime: () => <section data-testid='time'>Topcoder Time</section>,
}))

const LocationProbe = (): JSX.Element => {
    const location = useLocation()
    return <output data-testid='location'>{`${location.pathname}${location.search}`}</output>
}

/**
 * Renders the home page at its platform route.
 *
 * @param path initial browser path.
 * @returns render result.
 */
function renderHome(path: string = '/opportunities/home'): RenderResult {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route element={<HomePage />} path='/opportunities/home' />
                <Route element={<LocationProbe />} path='*' />
            </Routes>
        </MemoryRouter>,
    )
}

describe('HomePage', () => {
    beforeEach(() => {
        mockSubdomain = 'platform-ui'
        mockDomain = 'topcoder-dev.com'
    })

    it('renders the community-app dashboard widgets with the dev CMS viewports', () => {
        renderHome()

        expect(screen.getByRole('heading', { level: 1, name: 'Home' }))
            .toBeInTheDocument()
        expect(screen.getByTestId('page-title'))
            .toHaveTextContent('Home | Topcoder')
        expect(screen.getByTestId('time'))
            .toBeInTheDocument()
        expect(screen.getByTestId('feed'))
            .toHaveTextContent('/opportunities/competitions')
        expect(screen.getByTestId('cms-IYMEHgYwk6S0S9tx5SsHd'))
            .toHaveTextContent('Featured announcements banner')
        expect(screen.getByTestId('cms-2tq6jtu9GzPab7lAb7swlT'))
            .toHaveTextContent('Community links sidebar')
        expect(screen.getByTestId('cms-2qVJTorSdRVNlfRqoQocUH'))
            .toHaveTextContent('Community sidebar')
    })

    it('keeps the community-app desktop column order in the document', () => {
        renderHome()

        const order = screen.getAllByTestId(/^(time|feed|cms-)/)
            .map(element => element.getAttribute('data-testid'))
        expect(order)
            .toEqual([
                'time',
                'cms-2tq6jtu9GzPab7lAb7swlT',
                'cms-IYMEHgYwk6S0S9tx5SsHd',
                'feed',
                'cms-2qVJTorSdRVNlfRqoQocUH',
            ])
    })

    it('uses the production viewports outside -dev domains', () => {
        mockDomain = 'topcoder.com'

        renderHome()

        expect(screen.getByTestId('cms-1BK50OyMT29IOavUC7wSEB'))
            .toBeInTheDocument()
        expect(screen.getByTestId('cms-6sjlJHboX3aG3mFS5FnZND'))
            .toBeInTheDocument()
        expect(screen.getByTestId('cms-SSwOFPT8l0WpGhqCBRISG'))
            .toBeInTheDocument()
    })

    it('sends the TopGear host to its challenge listing', () => {
        mockSubdomain = 'topgear'

        renderHome('/opportunities/home?tab=1')

        expect(screen.getByTestId('location'))
            .toHaveTextContent('/opportunities/challenge?tab=1')
        expect(screen.queryByTestId('feed')).not.toBeInTheDocument()
    })
})
