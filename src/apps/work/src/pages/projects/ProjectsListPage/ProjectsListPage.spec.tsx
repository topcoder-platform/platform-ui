/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { Context, PropsWithChildren, ReactNode } from 'react'
import {
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { WorkAppContextModel } from '../../../lib/models/WorkAppContextModel.model'
import { useFetchProjectsList } from '../../../lib/hooks'

import { ProjectsListPage } from './ProjectsListPage'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('react-toastify', () => ({
    toast: {
        error: jest.fn(),
    },
}))
jest.mock('tc-auth-lib', () => ({
    decodeToken: jest.fn(),
}))
jest.mock('../../../lib/services/resources.service', () => ({
    fetchResourceRoles: jest.fn(),
    fetchResources: jest.fn(),
}))
jest.mock('~/apps/admin/src/lib', () => ({
    TableLoading: () => <div>Loading</div>,
}), {
    virtual: true,
})
jest.mock('~/apps/review/src/lib', () => ({
    PageWrapper: (
        props: PropsWithChildren<{ pageTitle?: string; rightHeader?: ReactNode }>,
    ) => (
        <div>
            <div data-testid='page-right-header'>{props.rightHeader}</div>
            <h1>{props.pageTitle}</h1>
            <div data-testid='page-content'>{props.children}</div>
        </div>
    ),
}), {
    virtual: true,
})
jest.mock('~/libs/ui', () => ({
    Button: (props: { label: string }) => (
        <button type='button'>
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})
jest.mock('../../../lib/components', () => ({
    Pagination: () => <div>Pagination</div>,
    ProjectsFilter: () => <div>Projects Filter</div>,
    ProjectsTable: () => <div>Projects Table</div>,
}))
jest.mock('../../../lib/contexts', () => {
    const React = require('react') as typeof import('react')

    mockWorkAppContext = React.createContext<WorkAppContextModel>({
        isAdmin: false,
        isAnonymous: false,
        isCopilot: false,
        isManager: false,
        isReadOnly: false,
        loginUserInfo: undefined,
        userRoles: [],
    })

    return {
        WorkAppContext: mockWorkAppContext,
    }
})
jest.mock('../../../lib/hooks', () => ({
    useFetchProjectsList: jest.fn(),
}))
jest.mock('../../../lib/constants', () => ({
    PROJECTS_PAGE_SIZE: 10,
}))
jest.mock('../../../lib/utils', () => ({
    checkCanEditProjectDetails:
        jest.requireActual('../../../lib/utils/permissions.utils').checkCanEditProjectDetails,
    checkCanManageProject: jest.requireActual('../../../lib/utils/permissions.utils').checkCanManageProject,
}))

const mockedUseFetchProjectsList = useFetchProjectsList as jest.Mock

const defaultContextValue: WorkAppContextModel = {
    isAdmin: false,
    isAnonymous: false,
    isCopilot: false,
    isManager: false,
    isReadOnly: false,
    loginUserInfo: {
        email: 'user@example.com',
        exp: 0,
        handle: 'work-user',
        iat: 0,
        roles: ['topcoder user'],
        userId: 12345,
    } as WorkAppContextModel['loginUserInfo'],
    userRoles: ['topcoder user'],
}

const projectManagerContextValue: WorkAppContextModel = {
    ...defaultContextValue,
    isManager: true,
    loginUserInfo: {
        ...defaultContextValue.loginUserInfo,
        roles: ['project manager'],
    } as WorkAppContextModel['loginUserInfo'],
    userRoles: ['project manager'],
}

function renderPage(contextValue: WorkAppContextModel = defaultContextValue): void {
    const MockWorkAppContext = mockWorkAppContext

    render(
        <MockWorkAppContext.Provider value={contextValue}>
            <MemoryRouter>
                <ProjectsListPage />
            </MemoryRouter>
        </MockWorkAppContext.Provider>,
    )
}

describe('ProjectsListPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedUseFetchProjectsList.mockReturnValue({
            error: undefined,
            isLoading: false,
            isValidating: false,
            metadata: {
                page: 1,
                perPage: 10,
                total: 0,
            },
            mutate: jest.fn(),
            projects: [],
        })
    })

    it('renders the new project action for project managers', () => {
        renderPage(projectManagerContextValue)

        const newProjectButton = screen.getByRole('button', { name: 'New Project' })
        const newProjectLink = screen.getByRole('link', { name: 'New Project' })

        expect(newProjectButton)
            .toBeTruthy()
        expect(newProjectLink.getAttribute('href'))
            .toBe('/projects/new')
    })
})
