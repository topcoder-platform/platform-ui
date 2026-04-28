/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

import { WorkAppContext } from '../../contexts/WorkAppContext'
import { WorkAppContextModel } from '../../models/WorkAppContextModel.model'
import NavTabs from './NavTabs'

jest.mock('~/config', () => ({
    AppSubdomain: {
        work: 'work',
    },
    EnvironmentConfig: {
        SUBDOMAIN: 'work',
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
        ExternalLinkIcon: (props: object) => jest.requireActual('react')
            .createElement('svg', props),
    },
}), {
    virtual: true,
})

jest.mock('../../utils/permissions.utils', () => ({
    canViewAllEngagements: (userRoles: string[]) => (
        userRoles.includes('administrator') || userRoles.includes('talent manager')
    ),
}))

const LocationViewer = (): JSX.Element => {
    const location = useLocation()

    return <div data-testid='location-pathname'>{location.pathname}</div>
}

function renderNavTabs(pathname: string = '/challenges'): void {
    const contextValue: WorkAppContextModel = {
        isAdmin: true,
        isAnonymous: false,
        isCopilot: false,
        isManager: false,
        isReadOnly: false,
        loginUserInfo: undefined,
        userRoles: ['administrator'],
    }

    render(
        <WorkAppContext.Provider value={contextValue}>
            <MemoryRouter initialEntries={[pathname]}>
                <NavTabs />
                <LocationViewer />
            </MemoryRouter>
        </WorkAppContext.Provider>,
    )
}

describe('NavTabs', () => {
    it('renders work app menu items as links so browser link actions are available', () => {
        renderNavTabs()

        expect(screen.getByRole('link', { name: 'Challenges' })
            .getAttribute('href'))
            .toBe('/challenges')
        expect(screen.getByRole('link', { name: 'Engagements' })
            .getAttribute('href'))
            .toBe('/engagements')
        expect(screen.getByRole('link', { name: 'Projects' })
            .getAttribute('href'))
            .toBe('/projects')
        expect(screen.getByRole('link', { name: 'TaaS Projects' })
            .getAttribute('href'))
            .toBe('/taas')
        expect(screen.getByRole('link', { name: 'Groups' })
            .getAttribute('href'))
            .toBe('/groups')
    })

    it('keeps normal left-click navigation working for internal tabs', () => {
        renderNavTabs('/challenges')

        fireEvent.click(screen.getByRole('link', { name: 'Projects' }))

        expect(screen.getByTestId('location-pathname').textContent)
            .toBe('/projects')
    })
})
