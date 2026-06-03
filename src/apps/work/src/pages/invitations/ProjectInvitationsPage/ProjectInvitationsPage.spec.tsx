/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { act } from 'react'
import type {
    Context,
    ReactNode,
} from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type {
    Project,
    ProjectInvite,
    WorkAppContextModel,
} from '../../../lib/models'
import { useFetchProject } from '../../../lib/hooks'
import { updateProjectMemberInvite } from '../../../lib/services'
import {
    checkIsUserInvitedToProject,
    getAuthAccessToken,
    showErrorToast,
} from '../../../lib/utils'

import { ProjectInvitationsPage } from './ProjectInvitationsPage'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: {
        buttons?: ReactNode
        children?: ReactNode
        onClose?: () => void
        open?: boolean
        title?: string
    }) => (
        props.open === false
            ? undefined
            : (
                <div>
                    <h2>{props.title}</h2>
                    {props.children}
                    {props.buttons}
                    {props.onClose
                        ? (
                            <button onClick={props.onClose} type='button'>
                                Close
                            </button>
                        )
                        : undefined}
                </div>
            )
    ),
    Button: (props: {
        label: string
        onClick?: () => void
        primary?: boolean
    }) => (
        <button
            data-primary={props.primary ? 'true' : 'false'}
            onClick={props.onClick}
            type='button'
        >
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
            <h2>{props.title}</h2>
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
    getAuthAccessToken: jest.fn(),
    showErrorToast: jest.fn(),
}))

const mockedUseFetchProject = useFetchProject as jest.MockedFunction<typeof useFetchProject>
const mockedUpdateProjectMemberInvite
    = updateProjectMemberInvite as jest.MockedFunction<typeof updateProjectMemberInvite>
const mockedCheckIsUserInvitedToProject
    = checkIsUserInvitedToProject as jest.MockedFunction<typeof checkIsUserInvitedToProject>
const mockedGetAuthAccessToken = getAuthAccessToken as jest.MockedFunction<typeof getAuthAccessToken>
const mockedShowErrorToast = showErrorToast as jest.MockedFunction<typeof showErrorToast>

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

const pendingInvitation: ProjectInvite = {
    email: 'invitee@example.com',
    id: '77',
    status: 'pending',
    userId: 123,
}

const invitedProject: Project = {
    id: '200',
    invites: [pendingInvitation],
    name: 'Invited Project',
    status: 'active',
}

interface RenderPageOptions {
    contextValue?: WorkAppContextModel
    error?: Error
    isLoading?: boolean
    project?: Project
    route?: string
}

/**
 * Renders the invitation page with a configurable fetch result so specs can
 * verify loading, invitation prompts, and post-accept navigation flows.
 *
 * @param options optional route, context, and mocked project-fetch state.
 * @returns the mocked SWR mutate function used by the page.
 */
function renderPage(options: RenderPageOptions = {}): jest.Mock {
    const {
        contextValue = defaultContextValue,
        error = undefined,
        isLoading = false,
        project = invitedProject,
        route = '/projects/200/invitations',
    }: RenderPageOptions = options
    const mutate = jest.fn()
        .mockResolvedValue(undefined)
    const MockWorkAppContext = mockWorkAppContext

    mockedUseFetchProject.mockReturnValue({
        error,
        isLoading,
        mutate,
        project,
    })

    render(
        <MockWorkAppContext.Provider value={contextValue}>
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route element={<div>Projects Page</div>} path='/projects' />
                    <Route
                        element={<ProjectInvitationsPage />}
                        path='/projects/:projectId/invitations/:action?'
                    />
                    <Route
                        element={<ProjectInvitationsPage />}
                        path='/projects/:projectId/invitation/:action?'
                    />
                    <Route
                        element={<div>Challenges Page</div>}
                        path='/projects/:projectId/challenges'
                    />
                </Routes>
            </MemoryRouter>
        </MockWorkAppContext.Provider>,
    )

    return mutate
}

describe('ProjectInvitationsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()

        mockedCheckIsUserInvitedToProject.mockReturnValue(undefined)
        mockedGetAuthAccessToken.mockReturnValue('token')
        mockedUpdateProjectMemberInvite.mockResolvedValue({
            ...pendingInvitation,
            status: 'accepted',
        })
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('does not redirect away while the invitation project is still loading', () => {
        renderPage({
            isLoading: true,
            project: undefined,
        })

        expect(screen.getByText('Loading Spinner'))
            .not.toBeNull()
        expect(screen.queryByText('Projects Page'))
            .toBeNull()
    })

    it('renders the invitation prompt when the current user invite is available', () => {
        const invitation: ProjectInvite = {
            email: 'invitee@example.com',
            id: 'invite-1',
            status: 'pending',
            userId: 123,
        }

        mockedCheckIsUserInvitedToProject.mockReturnValue(invitation)

        renderPage({
            project: {
                id: '200',
                invites: [invitation],
                name: 'Invited project',
                status: 'active',
            },
        })

        expect(screen.getByText('You are invited to join this project'))
            .not.toBeNull()
        expect(screen.getByText(/Invited project/))
            .not.toBeNull()
        expect(screen.queryByText('Projects Page'))
            .toBeNull()
    })

    it('keeps the accepted modal open until dismissed and updates the cached invite status', async () => {
        mockedCheckIsUserInvitedToProject.mockReturnValue(pendingInvitation)

        const mutate = renderPage()

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {
                name: 'Join project',
            }))
        })

        await waitFor(() => {
            expect(mockedUpdateProjectMemberInvite)
                .toHaveBeenCalledWith(
                    '200',
                    '77',
                    'accepted',
                    undefined,
                )
        })

        await waitFor(() => {
            expect(screen.queryByText('Invitation Accepted'))
                .not.toBeNull()
        })

        const mutateCallback = mutate.mock.calls[0][0] as (currentProject?: Project) => Project | undefined

        expect(mutateCallback(invitedProject))
            .toMatchObject({
                invites: [
                    {
                        id: '77',
                        status: 'accepted',
                    },
                ],
            })
        expect(mutate.mock.calls[0][1])
            .toBe(false)

        await act(async () => {
            jest.advanceTimersByTime(5000)
        })

        expect(screen.queryByText('Invitation Accepted'))
            .not.toBeNull()
        expect(screen.queryByText('Challenges Page'))
            .toBeNull()

        fireEvent.click(screen.getByRole('button', {
            name: 'OK',
        }))

        await waitFor(() => {
            expect(screen.queryByText('Challenges Page'))
                .not.toBeNull()
        })
    })

    it('redirects to the challenges page when the accepted modal is closed', async () => {
        mockedCheckIsUserInvitedToProject.mockReturnValue(pendingInvitation)

        renderPage()

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {
                name: 'Join project',
            }))
        })

        await waitFor(() => {
            expect(screen.queryByText('Invitation Accepted'))
                .not.toBeNull()
        })

        fireEvent.click(screen.getByRole('button', {
            name: 'Close',
        }))

        await waitFor(() => {
            expect(screen.queryByText('Challenges Page'))
                .not.toBeNull()
        })
    })

    it('shows an error and redirects to projects when the invite update fails', async () => {
        mockedCheckIsUserInvitedToProject.mockReturnValue(pendingInvitation)
        mockedUpdateProjectMemberInvite.mockRejectedValue(new Error('Update failed'))

        renderPage()

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {
                name: 'Join project',
            }))
        })

        await waitFor(() => {
            expect(mockedShowErrorToast)
                .toHaveBeenCalledWith('Update failed')
        })
    })

    it('refuses the current user invite from the legacy email invitation route', async () => {
        mockedCheckIsUserInvitedToProject.mockReturnValue(pendingInvitation)

        renderPage({
            route: '/projects/200/invitation/refused?source=email',
        })

        await waitFor(() => {
            expect(mockedUpdateProjectMemberInvite)
                .toHaveBeenCalledWith(
                    '200',
                    '77',
                    'refused',
                    'email',
                )
        })

        await waitFor(() => {
            expect(screen.queryByText('Invitation Declined'))
                .not.toBeNull()
        })
    })
})
