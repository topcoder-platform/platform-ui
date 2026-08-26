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
        customer: 'customer',
    },
    EnvironmentConfig: {
        SUBDOMAIN: 'customer',
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
        ChevronDownIcon: () => <span>chevron-down</span>,
        ExternalLinkIcon: () => <span>external-link</span>,
    },
}), {
    virtual: true,
})

jest.mock('../../contexts', () => {
    const React = jest.requireActual('react') as typeof import('react')

    return {
        CustomerPortalAppContext: React.createContext({
            loginUserInfo: {
                roles: ['administrator'],
            },
        }),
    }
})

jest.mock('./config', () => ({
    getTabIdFromPathName: () => 'talent-search',
    getTabsConfig: () => [
        {
            id: 'talent-search',
            title: 'Talent Search',
        },
        {
            id: 'showcase',
            title: 'Showcase',
        },
        {
            id: 'flexi-talent',
            title: 'Flexi-Talent',
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

describe('Customer Portal NavTabs', () => {
    it('navigates tabs from the app root when rendered in a wildcard route', () => {
        renderNavTabs('/talent-search/showcase/flexi-talent')

        const destinations: Array<[string, string]> = [
            ['Showcase', '/showcase'],
            ['Flexi-Talent', '/flexi-talent'],
            ['Talent Search', '/talent-search'],
        ]

        destinations.forEach(([tabTitle, expectedPath]) => {
            fireEvent.click(screen.getByText(tabTitle))

            expect(screen.getByTestId('location-pathname').textContent)
                .toBe(expectedPath)
        })
    })
})
