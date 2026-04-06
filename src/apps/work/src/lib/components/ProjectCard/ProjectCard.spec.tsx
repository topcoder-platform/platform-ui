/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { Project } from '../../models'

import { ProjectCard } from './ProjectCard'

jest.mock('../../utils', () => ({
    buildProjectChallengesPath: (projectId: string | number) => (
        `/projects/${encodeURIComponent(String(projectId))}/challenges`
    ),
    formatDateTime: () => 'Apr 6, 2026',
}))

jest.mock('../ProjectStatus', () => ({
    ProjectStatus: () => <span>Active</span>,
}))

describe('ProjectCard', () => {
    const invitedProject: Project = {
        id: 100440,
        invites: [
            {
                email: 'invitee@example.com',
                status: 'pending',
                userId: 123,
            },
        ],
        isInvited: true,
        name: 'Project created by admin',
        status: 'active',
    }

    it('uses the challenges route for the project card link', () => {
        render(
            <MemoryRouter>
                <ProjectCard project={invitedProject} />
            </MemoryRouter>,
        )

        expect(screen.getByText('Project created by admin')
            .closest('a')
            ?.getAttribute('href'))
            .toBe('/projects/100440/challenges')
    })
})
