/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { Project } from '../../models'

import { ProjectCard } from './ProjectCard'

jest.mock('../../utils', () => ({
<<<<<<< HEAD
    buildProjectChallengesPath: (projectId: string | number): string => `/projects/${projectId}/challenges`,
=======
    buildProjectChallengesPath: (projectId: string | number) => (
        `/projects/${encodeURIComponent(String(projectId))}/challenges`
    ),
>>>>>>> f3fc7bbad5828bdc7bfe780168015e37a03af149
    formatDateTime: () => 'Apr 6, 2026',
}))

jest.mock('../ProjectStatus', () => ({
<<<<<<< HEAD
    ProjectStatus: (props: { status?: string }) => <span>{props.status}</span>,
}))

describe('ProjectCard', () => {
    it('links invited projects to the canonical challenges route', () => {
        const project: Project = {
            id: '200',
            invites: [
                {
                    email: 'invitee@example.com',
                    status: 'pending',
                    userId: 123,
                },
            ],
            isInvited: true,
            lastActivityAt: '2026-04-06T00:00:00.000Z',
            name: 'Invited project',
            status: 'active',
        }

        render(
            <MemoryRouter>
                <ProjectCard project={project} />
            </MemoryRouter>,
        )

        expect(screen.getByRole('link', { name: /Invited project/i })
            .getAttribute('href'))
            .toBe('/projects/200/challenges')
=======
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
>>>>>>> f3fc7bbad5828bdc7bfe780168015e37a03af149
    })
})
