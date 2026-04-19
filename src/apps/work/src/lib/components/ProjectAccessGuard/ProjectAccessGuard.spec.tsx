/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { Context } from 'react'
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { WorkAppContextModel } from '../../models/WorkAppContextModel.model'
import { useFetchProject } from '../../hooks'
import {
    checkIsUserInvitedToProject,
    checkProjectMembership,
    getAuthAccessToken,
} from '../../utils'

import {
    ProjectAccessGuard,
    PROJECT_ACCESS_ERROR_MESSAGE,
} from './ProjectAccessGuard'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('../../../lib/components', () => ({
    ErrorMessage: (props: { message: string }) => <div>{props.message}</div>,
    LoadingSpinner: () => <div>Loading</div>,
}))
jest.mock('../../contexts', () => {
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
jest.mock('../../hooks', () => ({
    useFetchProject: jest.fn(),
}))
jest.mock('../../utils', () => ({
    checkIsUserInvitedToProject: jest.fn(() => undefined),
    checkProjectMembership: jest.fn(() => false),
    getAuthAccessToken: jest.fn(() => 'token'),
}))

const mockedUseFetchProject = useFetchProject as jest.Mock
const mockedCheckIsUserInvitedToProject = checkIsUserInvitedToProject as jest.Mock
const mockedCheckProjectMembership = checkProjectMembership as jest.Mock
const mockedGetAuthAccessToken = getAuthAccessToken as jest.Mock

const defaultContextValue: WorkAppContextModel = {
    isAdmin: false,
    isAnonymous: false,
    isCopilot: true,
    isManager: false,
    isReadOnly: false,
    loginUserInfo: {
        email: 'copilot@example.com',
        exp: 0,
        handle: 'copilot-user',
        iat: 0,
        roles: ['copilot'],
        userId: 12345,
    } as WorkAppContextModel['loginUserInfo'],
    userRoles: ['copilot'],
}

function renderGuard(
    route: string,
    contextValue: WorkAppContextModel = defaultContextValue,
): void {
    const MockWorkAppContext = mockWorkAppContext

    render(
        <MockWorkAppContext.Provider value={contextValue}>
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route
                        path='/projects/:projectId/challenges'
                        element={(
                            <ProjectAccessGuard>
                                <div>Protected Project Page</div>
                            </ProjectAccessGuard>
                        )}
                    />
                    <Route
                        path='/projects/:projectId/invitations'
                        element={(
                            <ProjectAccessGuard>
                                <div>Invitation Page</div>
                            </ProjectAccessGuard>
                        )}
                    />
                </Routes>
            </MemoryRouter>
        </MockWorkAppContext.Provider>,
    )
}

describe('ProjectAccessGuard', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: {
                id: 200,
                invites: [],
                members: [],
                name: 'Secret Project',
                status: 'active',
            },
        })
        mockedCheckIsUserInvitedToProject.mockReturnValue(undefined)
        mockedCheckProjectMembership.mockReturnValue(false)
        mockedGetAuthAccessToken.mockReturnValue('token')
    })

    it('shows the unauthorized access message for non-members', () => {
        renderGuard('/projects/200/challenges')

        expect(screen.getByText(PROJECT_ACCESS_ERROR_MESSAGE))
            .toBeTruthy()
        expect(screen.queryByText('Protected Project Page'))
            .toBeNull()
    })

    it('redirects invited users to the project invitation flow', async () => {
        mockedCheckIsUserInvitedToProject.mockReturnValue({
            id: 'invite-1',
            status: 'pending',
        })

        renderGuard('/projects/200/challenges')

        await waitFor(() => {
            expect(screen.getByText('Invitation Page'))
                .toBeTruthy()
        })
    })

    it('lets invited users open the invitation route', () => {
        mockedCheckIsUserInvitedToProject.mockReturnValue({
            id: 'invite-1',
            status: 'pending',
        })

        renderGuard('/projects/200/invitations')

        expect(screen.getByText('Invitation Page'))
            .toBeTruthy()
    })

    it('allows managers to bypass membership checks', () => {
        renderGuard(
            '/projects/200/challenges',
            {
                ...defaultContextValue,
                isCopilot: false,
                isManager: true,
                loginUserInfo: {
                    ...defaultContextValue.loginUserInfo,
                    roles: ['manager'],
                } as WorkAppContextModel['loginUserInfo'],
                userRoles: ['manager'],
            },
        )

        expect(screen.getByText('Protected Project Page'))
            .toBeTruthy()
    })
})
