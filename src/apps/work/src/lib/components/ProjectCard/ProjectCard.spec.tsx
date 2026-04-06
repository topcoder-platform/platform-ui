/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { Project } from '../../models'

import { ProjectCard } from './ProjectCard'

jest.mock('../../utils', () => ({
    buildProjectChallengesPath: (projectId: string | number): string => `/projects/${projectId}/challenges`,
    formatDateTime: () => 'Apr 6, 2026',
}))

jest.mock('../ProjectStatus', () => ({
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
    })
})
