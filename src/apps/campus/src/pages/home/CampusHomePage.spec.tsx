/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { PropsWithChildren } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import { CAMPUS_UNIVERSITIES } from '../../lib/config'

import { CampusHomePage } from './CampusHomePage'

jest.mock('~/config', () => ({
    AppSubdomain: { campus: 'campus' },
    EnvironmentConfig: { SUBDOMAIN: 'campus' },
    ToolTitle: { campus: 'Campus' },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    lazyLoad: () => (): undefined => undefined,
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    ContentLayout: (props: PropsWithChildren): JSX.Element => <div>{props.children}</div>,
    IconOutline: { ChevronRightIcon: (): JSX.Element => <svg /> },
    PageTitle: (): undefined => undefined,
}), { virtual: true })

const LocationViewer = (): JSX.Element => {
    const location = useLocation()

    return <div data-testid='location-pathname'>{location.pathname}</div>
}

function renderPage(): void {
    render(
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route element={<CampusHomePage />} path='/' />
                <Route element={<LocationViewer />} path='/:groupName' />
            </Routes>
        </MemoryRouter>,
    )
}

describe('CampusHomePage', () => {
    it('renders a card for every campus university', () => {
        renderPage()

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
        renderPage()

        const university = CAMPUS_UNIVERSITIES[0]
        fireEvent.click(screen.getByText(university.name))

        expect(screen.getByTestId('location-pathname').textContent)
            .toBe(`/${university.groupName}`)
    })
})
