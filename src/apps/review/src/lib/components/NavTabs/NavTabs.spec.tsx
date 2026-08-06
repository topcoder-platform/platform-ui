/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
    useLocation,
} from 'react-router-dom'

import NavTabs from './NavTabs'

jest.mock('~/config', () => ({
    AppSubdomain: {
        review: 'review',
    },
    EnvironmentConfig: {
        REVIEW: {
            OPPORTUNITIES_URL: 'https://example.com/opportunities',
        },
        SUBDOMAIN: 'review',
    },
}), {
    virtual: true,
})

jest.mock('~/libs/shared/lib/hooks', () => ({
    useClickOutside: jest.fn(),
}), {
    virtual: true,
})

jest.mock('~/libs/ui', () => ({
    IconOutline: {
        ExternalLinkIcon: () => <span>external-link</span>,
    },
}), {
    virtual: true,
})

jest.mock('../../contexts', () => {
    const React = jest.requireActual('react') as typeof import('react')

    return {
        ReviewAppContext: React.createContext({
            loginUserInfo: {
                roles: ['administrator'],
            },
        }),
    }
})

jest.mock('./config', () => ({
    getTabIdFromPathName: () => 'active-challenges',
    getTabsConfig: () => [
        {
            id: 'active-challenges',
            title: 'Active Challenges',
        },
        {
            id: 'past-challenges',
            title: 'Past Challenges',
        },
        {
            id: 'open-opportunities',
            title: 'Open Opportunities',
            url: 'https://example.com/opportunities',
        },
        {
            id: 'scorecard',
            title: 'Scorecards',
        },
    ],
}))

const LocationViewer = (): JSX.Element => {
    const location = useLocation()

    return <div data-testid='location-pathname'>{location.pathname}</div>
}

function renderNavTabs(pathname: string): void {
    render(
        <MemoryRouter initialEntries={[pathname]}>
            <Routes>
                <Route
                    path='/*'
                    element={(
                        <>
                            <NavTabs />
                            <LocationViewer />
                        </>
                    )}
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('Review NavTabs', () => {
    it('navigates internal tabs from the app root when rendered in a wildcard route', () => {
        renderNavTabs('/active-challenges/challenge-id/challenge-details/reviews/submission-id')

        const destinations: Array<[string, string]> = [
            ['Past Challenges', '/past-challenges'],
            ['Scorecards', '/scorecard'],
            ['Active Challenges', '/active-challenges'],
        ]

        destinations.forEach(([tabTitle, expectedPath]) => {
            fireEvent.click(screen.getByText(tabTitle))

            expect(screen.getByTestId('location-pathname').textContent)
                .toBe(expectedPath)
        })
    })
})
