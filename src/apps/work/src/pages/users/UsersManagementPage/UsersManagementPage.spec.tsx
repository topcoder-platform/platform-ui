/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { Context, PropsWithChildren, ReactNode } from 'react'
import {
    render,
    screen,
    within,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { WorkAppContextModel } from '../../../lib/models/WorkAppContextModel.model'
import {
    useFetchProject,
    useFetchProjectMembers,
} from '../../../lib/hooks'
import {
    checkCanEditProjectDetails,
    checkCanManageProject,
} from '../../../lib/utils'

import { UsersManagementPage } from './UsersManagementPage'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('~/apps/review/src/lib', () => ({
    PageWrapper: (
        props: PropsWithChildren<{
            backUrl?: string
            pageTitle?: string
            rightHeader?: ReactNode
            titleAction?: ReactNode
        }>,
    ) => (
        <div>
            {props.backUrl ? <div data-testid='page-back-link'>{props.backUrl}</div> : undefined}
            <div data-testid='page-right-header'>{props.rightHeader}</div>
            <h1>{props.pageTitle}</h1>
            <div data-testid='page-title-action'>{props.titleAction}</div>
            <div data-testid='page-content'>{props.children}</div>
        </div>
    ),
}), {
    virtual: true,
})
jest.mock('~/libs/ui', () => ({
    Button: (props: {
        label: string
        onClick?: () => void
        primary?: boolean
        secondary?: boolean
    }) => (
        <button
            data-primary={props.primary ? 'true' : 'false'}
            data-secondary={props.secondary ? 'true' : 'false'}
            onClick={props.onClick}
            type='button'
        >
            {props.label}
        </button>
    ),
    IconOutline: {
        PencilIcon: () => <span>pencil-icon</span>,
    },
}), {
    virtual: true,
})
jest.mock('../../../lib/components', () => ({
    AddUserModal: () => <div>Add User Modal</div>,
    InviteUserModal: () => <div>Invite User Modal</div>,
    LoadingSpinner: () => <div>Loading</div>,
    ProjectListTabs: () => <div>Project Tabs</div>,
    ProjectStatus: (props: { status: string }) => <div>{`Project Status: ${props.status}`}</div>,
    UserCard: () => <div>User Card</div>,
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
    useFetchProject: jest.fn(),
    useFetchProjectMembers: jest.fn(),
}))
jest.mock('../../../lib/services', () => ({
    deleteProjectMemberInvite: jest.fn(),
    removeMemberFromProject: jest.fn(),
}))
jest.mock('../../../lib/utils', () => ({
    checkCanEditProjectDetails: jest.fn(() => true),
    checkCanManageProject: jest.fn(() => true),
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))

const mockedUseFetchProject = useFetchProject as jest.Mock
const mockedUseFetchProjectMembers = useFetchProjectMembers as jest.Mock
const mockedCheckCanEditProjectDetails = checkCanEditProjectDetails as jest.Mock
const mockedCheckCanManageProject = checkCanManageProject as jest.Mock

const defaultContextValue: WorkAppContextModel = {
    isAdmin: true,
    isAnonymous: false,
    isCopilot: false,
    isManager: false,
    isReadOnly: false,
    loginUserInfo: {
        email: 'admin@example.com',
        exp: 0,
        handle: 'admin-user',
        iat: 0,
        roles: ['administrator'],
        userId: 12345,
    } as WorkAppContextModel['loginUserInfo'],
    userRoles: ['administrator'],
}

function renderPage(
    route: string,
    contextValue: WorkAppContextModel = defaultContextValue,
): void {
    const MockWorkAppContext = mockWorkAppContext

    render(
        <MockWorkAppContext.Provider value={contextValue}>
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path='/projects/:projectId/users' element={<UsersManagementPage />} />
                </Routes>
            </MemoryRouter>
        </MockWorkAppContext.Provider>,
    )
}

describe('UsersManagementPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedCheckCanEditProjectDetails.mockReturnValue(true)
        mockedCheckCanManageProject.mockReturnValue(true)

        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
            project: undefined,
        })
        mockedUseFetchProjectMembers.mockReturnValue({
            declinedInvites: [],
            error: undefined,
            invites: [],
            isLoading: false,
            members: [],
            mutate: jest.fn(),
        })
    })

    it('keeps the project name unchanged for the project users tab', () => {
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
            project: {
                id: 200,
                name: 'Payment Testing',
            },
        })

        renderPage('/projects/200/users')

        expect(screen.getByRole('heading', { level: 1, name: 'Payment Testing' }))
            .toBeTruthy()
        expect(screen.queryByText('Payment Testing users'))
            .toBeNull()
    })

    it('renders member actions in the shared page header and project edit in the title action', () => {
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
            project: {
                id: 200,
                name: 'Payment Testing',
                status: 'active',
            },
        })

        renderPage('/projects/200/users')

        const pageRightHeader = screen.getByTestId('page-right-header')
        const pageTitleAction = screen.getByTestId('page-title-action')

        expect(within(pageRightHeader)
            .getByRole('button', { name: 'Add User' }))
            .toBeTruthy()
        expect(within(pageRightHeader)
            .getByRole('button', { name: 'Invite User' }))
            .toBeTruthy()
        expect(within(pageTitleAction)
            .getByRole('link', { name: 'Edit project' }))
            .toBeTruthy()
        expect(within(pageTitleAction)
            .getByText('Project Status: active'))
            .toBeTruthy()
        expect(screen.queryByTestId('page-back-link'))
            .toBeNull()
    })

    it('hides member management actions when a global manager role cannot manage the project', () => {
        mockedCheckCanEditProjectDetails.mockReturnValue(false)
        mockedCheckCanManageProject.mockReturnValue(false)
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
            project: {
                id: 200,
                name: 'Restricted Project',
                status: 'active',
            },
        })

        renderPage('/projects/200/users', {
            ...defaultContextValue,
            isAdmin: false,
            isManager: true,
            loginUserInfo: {
                email: 'manager@example.com',
                exp: 0,
                handle: 'manager-user',
                iat: 0,
                roles: ['project manager'],
                userId: 12345,
            } as WorkAppContextModel['loginUserInfo'],
            userRoles: ['project manager'],
        })

        const pageRightHeader = screen.getByTestId('page-right-header')
        const pageTitleAction = screen.getByTestId('page-title-action')

        expect(within(pageRightHeader)
            .queryByRole('button', { name: 'Add User' }))
            .toBeNull()
        expect(within(pageRightHeader)
            .queryByRole('button', { name: 'Invite User' }))
            .toBeNull()
        expect(within(pageTitleAction)
            .queryByRole('link', { name: 'Edit project' }))
            .toBeNull()
    })

    it('hides project edit action when a copilot can manage but cannot edit project details', () => {
        mockedCheckCanEditProjectDetails.mockReturnValue(false)
        mockedCheckCanManageProject.mockReturnValue(true)
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
            project: {
                id: 200,
                members: [
                    {
                        role: 'copilot',
                        userId: 12345,
                    },
                ],
                name: 'Copilot Project',
                status: 'active',
            },
        })

        renderPage('/projects/200/users', {
            ...defaultContextValue,
            isAdmin: false,
            isCopilot: true,
            loginUserInfo: {
                email: 'copilot@example.com',
                exp: 0,
                handle: 'copilot-user',
                iat: 0,
                roles: ['copilot'],
                userId: 12345,
            } as WorkAppContextModel['loginUserInfo'],
            userRoles: ['copilot'],
        })

        expect(within(screen.getByTestId('page-right-header'))
            .getByRole('button', { name: 'Add User' }))
            .toBeTruthy()
        expect(within(screen.getByTestId('page-title-action'))
            .queryByRole('link', { name: 'Edit project' }))
            .toBeNull()
    })
})
