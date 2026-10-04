/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { PropsWithChildren } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import { profileContext } from '~/libs/core'

import { CAMPUS_UNIVERSITIES } from '../../lib/config'

import { CampusHomePage } from './CampusHomePage'

jest.mock('~/config', () => ({
    AppSubdomain: { campus: 'campus' },
    EnvironmentConfig: { SUBDOMAIN: 'campus' },
    ToolTitle: { campus: 'Campus' },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    lazyLoad: () => (): undefined => undefined,
    profileContext: jest.requireActual('react')
        .createContext({}),
    UserRole: {
        administrator: 'administrator',
        projectManager: 'Project Manager',
        talentManager: 'Talent Manager',
    },
}), { virtual: true })

jest.mock('~/libs/shared', () => ({
    RestrictedPage: (): JSX.Element => <div>Thanks for visiting</div>,
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    ContentLayout: (props: PropsWithChildren): JSX.Element => <div>{props.children}</div>,
    IconOutline: { ChevronRightIcon: (): JSX.Element => <svg /> },
    PageTitle: (): undefined => undefined,
}), { virtual: true })

interface TestProfile {
    email: string
    roles: string[]
}

const LocationViewer = (): JSX.Element => {
    const location = useLocation()

    return <div data-testid='location-pathname'>{location.pathname}</div>
}

function renderPage(profile?: TestProfile): void {
    render(
        <profileContext.Provider value={{ initialized: true, profile } as any}>
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route element={<CampusHomePage />} path='/' />
                    <Route element={<LocationViewer />} path='/:groupName' />
                </Routes>
            </MemoryRouter>
        </profileContext.Provider>,
    )
}

const wiproUser: TestProfile = { email: 'jane.doe@Wipro.com', roles: ['Topcoder User'] }

describe('CampusHomePage', () => {
    it('renders a card for every campus university', () => {
        renderPage(wiproUser)

        CAMPUS_UNIVERSITIES.forEach(university => {
            expect(screen.getByText(university.name))
                .toBeInTheDocument()
        })
        expect(screen.getAllByText('View Leaderboard'))
            .toHaveLength(CAMPUS_UNIVERSITIES.length)
        expect(screen.queryByText('Justin University'))
            .not.toBeInTheDocument()
    })

    it('opens the university leaderboard when a card is clicked', () => {
        renderPage(wiproUser)

        const university = CAMPUS_UNIVERSITIES[0]
        fireEvent.click(screen.getByText(university.name))

        expect(screen.getByTestId('location-pathname').textContent)
            .toBe(`/${university.groupName}`)
    })

    it.each(['administrator', 'Project Manager', 'Talent Manager'])(
        'lets %s users in regardless of their email',
        role => {
            renderPage({ email: 'someone@example.com', roles: ['Topcoder User', role] })

            expect(screen.getAllByText('View Leaderboard'))
                .toHaveLength(CAMPUS_UNIVERSITIES.length)
        },
    )

    it.each([
        ['a regular member', 'someone@example.com'],
        ['a lookalike wipro domain', 'someone@wipro.com.example.com'],
    ])('shows the restricted page to %s', (_, email) => {
        renderPage({ email, roles: ['Topcoder User'] })

        expect(screen.getByText('Thanks for visiting'))
            .toBeInTheDocument()
        expect(screen.queryByText('View Leaderboard'))
            .not.toBeInTheDocument()
    })
})
