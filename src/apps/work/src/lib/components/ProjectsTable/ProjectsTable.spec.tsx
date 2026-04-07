/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { ReactNode } from 'react'
import {
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { Project } from '../../models'
import { useFetchBillingAccounts } from '../../hooks'

import { ProjectsTable } from './ProjectsTable'

jest.mock('../../hooks', () => ({
    useFetchBillingAccounts: jest.fn(),
}))

jest.mock('../../constants', () => ({
    PROJECT_STATUS: {
        DRAFT: 'draft',
    },
}))

jest.mock('../../utils', () => ({
    buildProjectChallengesPath: (projectId: string | number) => (
        `/projects/${encodeURIComponent(String(projectId))}/challenges`
    ),
    formatDateTime: () => 'Apr 6, 2026',
}))

jest.mock('~/libs/ui', () => ({
    LoadingSpinner: () => <div>Loading</div>,
    Table: (props: {
        columns: Array<{
            label: string
            renderer?: (project: Project) => ReactNode
        }>
        data: Project[]
    }) => (
        <div>
            {props.data.map(project => (
                <div key={String(project.id)}>
                    {props.columns.map(column => (
                        <div key={column.label}>
                            {column.renderer ? column.renderer(project) : undefined}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    ),
}), {
    virtual: true,
})

jest.mock('../ProjectStatus', () => ({
    ProjectStatus: () => <span>Active</span>,
}))

const mockedUseFetchBillingAccounts = useFetchBillingAccounts as jest.MockedFunction<typeof useFetchBillingAccounts>

describe('ProjectsTable', () => {
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
        name: 'SK project1',
        status: 'active',
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockedUseFetchBillingAccounts.mockReturnValue({
            billingAccounts: [],
            error: undefined,
            isError: false,
            isLoading: false,
        })
    })

    it('links the project name and open action to the challenges route', () => {
        render(
            <MemoryRouter>
                <ProjectsTable
                    projects={[invitedProject]}
                    sortBy='name'
                    sortOrder='asc'
                    onSort={jest.fn()}
                />
            </MemoryRouter>,
        )

        expect(screen.getByRole('link', { name: 'SK project1' })
            .getAttribute('href'))
            .toBe('/projects/100440/challenges')
        expect(screen.getByRole('link', { name: 'Open' })
            .getAttribute('href'))
            .toBe('/projects/100440/challenges')
    })
})
