/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type {
    Context,
    ReactNode,
} from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { WorkAppContextModel } from '../../../lib/models/WorkAppContextModel.model'
import {
    useFetchProject,
} from '../../../lib/hooks'
import {
    checkIsUserInvitedToProject,
} from '../../../lib/utils'

import { ProjectInvitationsPage } from './ProjectInvitationsPage'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: {
        buttons?: ReactNode
        children?: ReactNode
        title?: string
    }) => (
        <div>
            <h1>{props.title}</h1>
            {props.children}
            {props.buttons}
        </div>
    ),
    Button: (props: {
        label: string
        onClick?: () => void
    }) => (
        <button onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})
jest.mock('../../../lib/components', () => ({
    LoadingSpinner: () => <div>Loading Spinner</div>,
}))
jest.mock('../../../lib/components/ConfirmationModal', () => ({
    ConfirmationModal: (props: {
        cancelText: string
        confirmText: string
        message: string
        onCancel?: () => void
        onConfirm?: () => void
        title: string
    }) => (
        <div>
            <h1>{props.title}</h1>
            <p>{props.message}</p>
            <button onClick={props.onConfirm} type='button'>
                {props.confirmText}
            </button>
            <button onClick={props.onCancel} type='button'>
                {props.cancelText}
            </button>
        </div>
    ),
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
}))
jest.mock('../../../lib/services', () => ({
    updateProjectMemberInvite: jest.fn(),
}))
jest.mock('../../../lib/utils', () => ({
    checkIsUserInvitedToProject: jest.fn(),
    getAuthAccessToken: jest.fn(() => 'token'),
    showErrorToast: jest.fn(),
}))

const mockedUseFetchProject = useFetchProject as jest.Mock
const mockedCheckIsUserInvitedToProject = checkIsUserInvitedToProject as jest.Mock

const defaultContextValue: WorkAppContextModel = {
    isAdmin: false,
    isAnonymous: false,
    isCopilot: true,
    isManager: false,
    isReadOnly: false,
    loginUserInfo: {
        email: 'invitee@example.com',
        exp: 0,
        handle: 'invitee',
        iat: 0,
        roles: ['copilot'],
        userId: 123,
    } as WorkAppContextModel['loginUserInfo'],
    userRoles: ['copilot'],
}

function renderPage(route: string, contextValue: WorkAppContextModel = defaultContextValue): void {
    const MockWorkAppContext = mockWorkAppContext

    render(
        <MockWorkAppContext.Provider value={contextValue}>
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path='/projects' element={<div>Projects Page</div>} />
                    <Route path='/projects/:projectId/invitations/:action?' element={<ProjectInvitationsPage />} />
                </Routes>
            </MemoryRouter>
        </MockWorkAppContext.Provider>,
    )
}

describe('ProjectInvitationsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedCheckIsUserInvitedToProject.mockReturnValue(undefined)
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: undefined,
        })
    })

    it('does not redirect away while the invitation project is still loading', () => {
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: true,
            project: undefined,
        })

        renderPage('/projects/200/invitations')

        expect(screen.getByText('Loading Spinner'))
            .not
            .toBeNull()
        expect(screen.queryByText('Projects Page'))
            .toBeNull()
    })

    it('renders the invitation prompt when the current user invite is available', () => {
        const invitation = {
            email: 'invitee@example.com',
            id: 'invite-1',
            status: 'pending',
            userId: 123,
        }

        mockedCheckIsUserInvitedToProject.mockReturnValue(invitation)
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: {
                id: 200,
                invites: [invitation],
                name: 'Invited project',
                status: 'active',
            },
        })

        renderPage('/projects/200/invitations')

        expect(screen.getByText('You are invited to join this project'))
            .not
            .toBeNull()
        expect(screen.getByText(/Invited project/))
            .not
            .toBeNull()
        expect(screen.queryByText('Projects Page'))
            .toBeNull()
    })
})
