/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import { WorkAppContext } from '../../contexts/WorkAppContext'
import { WorkAppContextModel } from '../../models/WorkAppContextModel.model'
import { ProjectListTabs } from './ProjectListTabs'

jest.mock('../../utils/permissions.utils', () => ({
    canViewAllEngagements: (userRoles: string[]) => (
        userRoles.includes('administrator') || userRoles.includes('talent manager')
    ),
}))

const LocationStateViewer = (): JSX.Element => {
    const location = useLocation()
    const backTo = (location.state as { backTo?: string } | null)?.backTo || 'missing'

    return <div data-testid='users-location-state'>{backTo}</div>
}

function renderProjectListTabs(
    pathname: string = '/projects/200/challenges',
    userRoles: string[] = ['administrator'],
): void {
    const contextValue: WorkAppContextModel = {
        isAdmin: false,
        isAnonymous: false,
        isCopilot: false,
        isManager: false,
        isReadOnly: false,
        loginUserInfo: undefined,
        userRoles,
    }

    render(
        <WorkAppContext.Provider value={contextValue}>
            <MemoryRouter initialEntries={[pathname]}>
                <ProjectListTabs projectId='200' />
            </MemoryRouter>
        </WorkAppContext.Provider>,
    )
}

describe('ProjectListTabs', () => {
    it('renders challenge, engagement, user, and assets tabs for engagement-enabled roles', () => {
        renderProjectListTabs()

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

    it('hides the engagements tab for project managers and copilots', () => {
        renderProjectListTabs('/projects/200/challenges', ['project manager'])

        expect(screen.queryByRole('link', { name: 'Engagements' }))
            .toBeNull()

        renderProjectListTabs('/projects/200/challenges', ['copilot'])

        expect(screen.queryAllByRole('link', { name: 'Engagements' }))
            .toHaveLength(0)
    })

    it.each([
        ['/projects/200/challenges', 'Challenges'],
        ['/projects/200/engagements', 'Engagements'],
        ['/projects/200/users', 'Users'],
        ['/projects/200/assets', 'Assets Library'],
        ['/projects/200/showcase', 'Showcase'],
    ])('marks the matching tab active for %s', (pathname: string, activeLabel: string) => {
        renderProjectListTabs(pathname)

        expect(screen.getByRole('link', { name: activeLabel }).className)
            .toContain('active')
    })

    it('preserves the current project path as users tab back navigation state', () => {
        const contextValue: WorkAppContextModel = {
            isAdmin: false,
            isAnonymous: false,
            isCopilot: false,
            isManager: false,
            isReadOnly: false,
            loginUserInfo: undefined,
            userRoles: ['administrator'],
        }

        render(
            <WorkAppContext.Provider value={contextValue}>
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
                </MemoryRouter>
            </WorkAppContext.Provider>,
        )

        fireEvent.click(screen.getByRole('link', { name: 'Users' }))

        expect(screen.getByTestId('users-location-state').textContent)
            .toBe('/projects/200/challenges?status=active#copilot')
    })
})
