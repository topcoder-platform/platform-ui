/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { act } from 'react'
import type { Context, PropsWithChildren } from 'react'
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
    BaseModal: (props: PropsWithChildren<{
        buttons?: JSX.Element
        children?: JSX.Element
        onClose?: () => void
        open?: boolean
        title?: string
    }>) => (
        props.open
            ? (
                <div>
                    <h2>{props.title}</h2>
                    {props.children}
                    {props.buttons}
                    <button onClick={props.onClose} type='button'>
                        Close
                    </button>
                </div>
            )
            : undefined
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
    LoadingSpinner: () => <div>Loading</div>,
}))

jest.mock('../../../lib/components/ConfirmationModal', () => ({
    ConfirmationModal: (props: {
        cancelText: string
        confirmText: string
        message: string
        onCancel: () => void
        onConfirm: () => void
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

const contextValue: WorkAppContextModel = {
    isAdmin: false,
    isAnonymous: false,
    isCopilot: false,
    isManager: false,
    isReadOnly: false,
    loginUserInfo: {
        email: 'invitee@example.com',
        exp: 0,
        handle: 'invitee-user',
        iat: 0,
        roles: [],
        userId: 123,
    } as WorkAppContextModel['loginUserInfo'],
    userRoles: [],
}

const pendingInvitation: ProjectInvite = {
    email: 'invitee@example.com',
    id: '77',
    status: 'pending',
    userId: 123,
}

const project: Project = {
    id: '200',
    invites: [pendingInvitation],
    name: 'Invited Project',
    status: 'active',
}

/**
 * Renders the invitation route with the shared mocked app context and a
 * project challenges route so the spec can observe post-dismiss navigation.
 *
 * @returns the mocked SWR mutate function associated with the fetched project.
 */
function renderPage(): jest.Mock {
    const mutate = jest.fn()
        .mockResolvedValue(undefined)
    const MockWorkAppContext = mockWorkAppContext

    mockedUseFetchProject.mockReturnValue({
        error: undefined,
        isLoading: false,
        mutate,
        project,
    })

    render(
        <MockWorkAppContext.Provider value={contextValue}>
            <MemoryRouter initialEntries={['/projects/200/invitations']}>
                <Routes>
                    <Route
                        element={<ProjectInvitationsPage />}
                        path='/projects/:projectId/invitations/:action?'
                    />
                    <Route
                        element={<div>Projects Page</div>}
                        path='/projects'
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

        mockedCheckIsUserInvitedToProject.mockReturnValue(pendingInvitation)
        mockedGetAuthAccessToken.mockReturnValue('token')
        mockedUpdateProjectMemberInvite.mockResolvedValue({
            ...pendingInvitation,
            status: 'accepted',
        })
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('keeps the accepted modal open until dismissed and updates the cached invite status', async () => {
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
            expect(screen.queryByText('Invitation Accepted')).not.toBeNull()
        })

        const mutateCallback = mutate.mock.calls[0][0] as (currentProject?: Project) => Project | undefined
        expect(mutateCallback(project))
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
            expect(screen.queryByText('Challenges Page')).not.toBeNull()
        })
    })

    it('redirects to the challenges page when the accepted modal is closed', async () => {
        renderPage()

        await act(async () => {
            fireEvent.click(screen.getByRole('button', {
                name: 'Join project',
            }))
        })

        await waitFor(() => {
            expect(screen.queryByText('Invitation Accepted')).not.toBeNull()
        })

        fireEvent.click(screen.getByRole('button', {
            name: 'Close',
        }))

        await waitFor(() => {
            expect(screen.queryByText('Challenges Page')).not.toBeNull()
        })
    })

    it('shows an error and redirects to projects when the invite update fails', async () => {
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
})
