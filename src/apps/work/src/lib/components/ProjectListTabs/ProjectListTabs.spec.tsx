/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import { ProjectListTabs } from './ProjectListTabs'

const LocationStateViewer = (): JSX.Element => {
    const location = useLocation()
    const backTo = (location.state as { backTo?: string } | null)?.backTo || 'missing'

    return <div data-testid='users-location-state'>{backTo}</div>
}

describe('ProjectListTabs', () => {
    it('renders challenge, engagement, user, and assets tabs', () => {
        render(
            <MemoryRouter initialEntries={['/projects/200/challenges']}>
                <ProjectListTabs projectId='200' />
            </MemoryRouter>,
        )

        expect(screen.getByRole('link', { name: 'Challenges' })
            .getAttribute('href'))
            .toBe('/projects/200/challenges')
        expect(screen.getByRole('link', { name: 'Engagements' })
            .getAttribute('href'))
            .toBe('/projects/200/engagements')
        expect(screen.getByRole('link', { name: 'Users' })
            .getAttribute('href'))
            .toBe('/projects/200/users')
        expect(screen.getByRole('link', { name: 'Assets Library' })
            .getAttribute('href'))
            .toBe('/projects/200/assets')
    })

    it.each([
        ['/projects/200/challenges', 'Challenges'],
        ['/projects/200/engagements', 'Engagements'],
        ['/projects/200/users', 'Users'],
        ['/projects/200/assets', 'Assets Library'],
    ])('marks the matching tab active for %s', (pathname: string, activeLabel: string) => {
        render(
            <MemoryRouter initialEntries={[pathname]}>
                <ProjectListTabs projectId='200' />
            </MemoryRouter>,
        )

        expect(screen.getByRole('link', { name: activeLabel }).className)
            .toContain('active')
    })

    it('preserves the current project path as users tab back navigation state', () => {
        render(
            <MemoryRouter initialEntries={['/projects/200/challenges?status=active#copilot']}>
                <Routes>
                    <Route
                        path='/projects/:projectId/challenges'
                        element={<ProjectListTabs projectId='200' />}
                    />
                    <Route
                        path='/projects/:projectId/users'
                        element={<LocationStateViewer />}
                    />
                </Routes>
            </MemoryRouter>,
        )

        fireEvent.click(screen.getByRole('link', { name: 'Users' }))

        expect(screen.getByTestId('users-location-state').textContent)
            .toBe('/projects/200/challenges?status=active#copilot')
    })
})
