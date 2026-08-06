/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    MemoryRouter,
    Navigator,
    Route,
    Router,
    Routes,
    useLocation,
} from 'react-router-dom'

import SystemAdminTabs from './SystemAdminTabs'

jest.mock('~/config', () => ({
    AppSubdomain: {
        admin: 'system-admin',
    },
    EnvironmentConfig: {
        SUBDOMAIN: 'system-admin',
    },
}), {
    virtual: true,
})

jest.mock('~/libs/core', () => ({
    useProfileContext: () => ({
        profile: {
            roles: ['administrator'],
        },
    }),
}), {
    virtual: true,
})

jest.mock('~/libs/ui', () => ({
    TabsNavbar: (props: {
        defaultActive: string
        onChange: (tabId: string) => void
        onChildChange: (tabId: string, childTabId: string) => void
        tabs: Array<{
            children?: Array<{
                id: string
                title: string
            }>
            id: string
            title: string
        }>
    }) => {
        const React = jest.requireActual('react') as typeof import('react')

        return React.createElement(
            'div',
            undefined,
            React.createElement(
                'span',
                { 'data-testid': 'active-tab' },
                props.defaultActive,
            ),
            props.tabs.map(tab => (
                tab.children
                    ? React.createElement(
                        'div',
                        { key: tab.id },
                        tab.children.map(child => React.createElement(
                            'button',
                            {
                                key: child.id,
                                onClick: () => props.onChildChange(tab.id, child.id),
                                type: 'button',
                            },
                            child.title,
                        )),
                    )
                    : React.createElement(
                        'button',
                        {
                            key: tab.id,
                            onClick: () => props.onChange(tab.id),
                            type: 'button',
                        },
                        tab.title,
                    )
            )),
        )
    },
}), {
    virtual: true,
})

jest.mock('./config', () => ({
    getSystemAdminTabs: () => [
        {
            id: 'challenge-management',
            title: 'Challenge Management',
        },
        {
            id: 'user-management',
            title: 'User Management',
        },
        {
            id: 'review-management',
            title: 'Review Management',
        },
        {
            children: [
                {
                    id: 'billing-account/clients',
                    title: 'Clients',
                },
            ],
            id: 'billing-account',
            title: 'Billing Account',
        },
        {
            children: [
                {
                    id: 'permission-management/groups',
                    title: 'Groups',
                },
            ],
            id: 'permission-management',
            title: 'Permission Management',
        },
        {
            children: [
                {
                    id: 'platform/skills',
                    title: 'Skills',
                },
            ],
            id: 'platform',
            title: 'Platform',
        },
        {
            id: 'payments',
            title: 'Payments',
        },
        {
            children: [
                {
                    id: 'ai/review-templates',
                    title: 'AI Review Templates',
                },
            ],
            id: 'ai',
            title: 'AI',
        },
    ],
    getTabIdFromPathName: (pathname: string) => [
        'challenge-management',
        'user-management',
        'review-management',
        'billing-account',
        'permission-management',
        'platform',
        'payments',
        'ai',
    ].find(tabId => pathname.includes(`/${tabId}`)) ?? 'challenge-management',
}))

const LocationViewer = (): JSX.Element => {
    const location = useLocation()

    return <div data-testid='location-pathname'>{location.pathname}</div>
}

function renderSystemAdminTabs(pathname: string): void {
    render(
        <MemoryRouter initialEntries={[pathname]}>
            <Routes>
                <Route
                    path='/*'
                    element={(
                        <>
                            <SystemAdminTabs />
                            <LocationViewer />
                        </>
                    )}
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('SystemAdminTabs', () => {
    it('keeps the clicked tab active while the router location update is pending', () => {
        const navigator: Navigator = {
            createHref: jest.fn(() => ''),
            go: jest.fn(),
            push: jest.fn(),
            replace: jest.fn(),
        }
        const view = render(
            <Router location='/challenge-management' navigator={navigator}>
                <SystemAdminTabs />
            </Router>,
        )

        fireEvent.click(screen.getByRole('button', { name: 'User Management' }))

        expect(navigator.push)
            .toHaveBeenCalledTimes(1)
        expect(screen.getByTestId('active-tab').textContent)
            .toBe('user-management')

        view.rerender(
            <Router location='/user-management' navigator={navigator}>
                <SystemAdminTabs />
            </Router>,
        )

        expect(screen.getByTestId('active-tab').textContent)
            .toBe('user-management')

        view.rerender(
            <Router location='/challenge-management' navigator={navigator}>
                <SystemAdminTabs />
            </Router>,
        )

        expect(screen.getByTestId('active-tab').textContent)
            .toBe('challenge-management')
    })

    it('navigates top-level tabs from the app root when rendered in a wildcard route', () => {
        renderSystemAdminTabs(
            '/challenge-management/user-management/user-management/review-management',
        )

        const destinations: Array<[string, string]> = [
            ['User Management', '/user-management'],
            ['Review Management', '/review-management'],
            ['Challenge Management', '/challenge-management'],
            ['Payments', '/payments'],
        ]

        destinations.forEach(([tabTitle, expectedPath]) => {
            fireEvent.click(screen.getByRole('button', { name: tabTitle }))

            expect(screen.getByTestId('location-pathname').textContent)
                .toBe(expectedPath)
        })
    })

    it('navigates child tabs from the app root when rendered in a wildcard route', () => {
        renderSystemAdminTabs('/challenge-management/challenge-id/manage-user')

        const destinations: Array<[string, string]> = [
            ['Clients', '/billing-account/clients'],
            ['Groups', '/permission-management/groups'],
            ['Skills', '/platform/skills'],
            ['AI Review Templates', '/ai/review-templates'],
        ]

        destinations.forEach(([tabTitle, expectedPath]) => {
            fireEvent.click(screen.getByRole('button', { name: tabTitle }))

            expect(screen.getByTestId('location-pathname').textContent)
                .toBe(expectedPath)
        })
    })
})
