/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type {
    Context,
    PropsWithChildren,
} from 'react'
import {
    render,
    screen,
} from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'

import { WorkAppContextModel } from '../../models'
import { useFetchProject } from '../../hooks'
import { checkProjectAccess } from '../../utils'

import {
    PROJECT_ACCESS_DENIED_MESSAGE,
    ProjectRouteAccessGuard,
} from './ProjectRouteAccessGuard'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('~/apps/review/src/lib', () => ({
    PageWrapper: (
        props: PropsWithChildren<{
            pageTitle?: string
        }>,
    ) => (
        <div>
            <h1>{props.pageTitle}</h1>
            <div data-testid='page-content'>{props.children}</div>
        </div>
    ),
}), {
    virtual: true,
})
jest.mock('~/libs/ui', () => ({
    Button: (props: { label: string }) => (
        <button type='button'>{props.label}</button>
    ),
    LoadingSpinner: () => <div>Loading Spinner</div>,
}), {
    virtual: true,
})
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
    checkProjectAccess: jest.fn(),
}))

const mockedUseFetchProject = useFetchProject as jest.Mock
const mockedCheckProjectAccess = checkProjectAccess as jest.Mock

const defaultContextValue: WorkAppContextModel = {
    isAdmin: false,
    isAnonymous: false,
    isCopilot: false,
    isManager: true,
    isReadOnly: false,
    loginUserInfo: {
        email: 'manager@example.com',
        exp: 0,
        handle: 'manager-user',
        iat: 0,
        roles: ['Project Manager'],
        userId: 12345,
    } as WorkAppContextModel['loginUserInfo'],
    userRoles: ['Project Manager'],
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
                        path='/projects/:projectId/users'
                        element={(
                            <ProjectRouteAccessGuard pageTitle='Users'>
                                <div>Protected Project Users</div>
                            </ProjectRouteAccessGuard>
                        )}
                    />
                </Routes>
            </MemoryRouter>
        </MockWorkAppContext.Provider>,
    )
}

describe('ProjectRouteAccessGuard', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
            project: {
                id: 200,
                members: [{
                    userId: 12345,
                }],
            },
        })
        mockedCheckProjectAccess.mockReturnValue(true)
    })

    it('renders the protected route when project access is allowed', () => {
        renderGuard('/projects/200/users')

        expect(mockedCheckProjectAccess)
            .toHaveBeenCalledWith(defaultContextValue.userRoles, 12345, expect.objectContaining({ id: 200 }))
        expect(screen.getByText('Protected Project Users'))
            .toBeTruthy()
    })

    it('renders the protected route when cached project access survives a revalidation error', () => {
        mockedUseFetchProject.mockReturnValue({
            error: new Error('Network unavailable'),
            isLoading: false,
            mutate: jest.fn(),
            project: {
                id: 200,
                members: [{
                    userId: 12345,
                }],
            },
        })
        mockedCheckProjectAccess.mockReturnValue(true)

        renderGuard('/projects/200/users')

        expect(mockedCheckProjectAccess)
            .toHaveBeenCalledWith(defaultContextValue.userRoles, 12345, expect.objectContaining({ id: 200 }))
        expect(screen.getByText('Protected Project Users'))
            .toBeTruthy()
        expect(screen.queryByText(PROJECT_ACCESS_DENIED_MESSAGE))
            .toBeNull()
    })

    it('shows loading while project access is resolving', () => {
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: true,
            mutate: jest.fn(),
            project: undefined,
        })

        renderGuard('/projects/200/users')

        expect(screen.getByRole('heading', { level: 1, name: 'Users' }))
            .toBeTruthy()
        expect(screen.getByText('Loading Spinner'))
            .toBeTruthy()
        expect(screen.queryByText('Protected Project Users'))
            .toBeNull()
        expect(mockedCheckProjectAccess)
            .not.toHaveBeenCalled()
    })

    it('shows the project access denial message when project access is rejected', () => {
        mockedCheckProjectAccess.mockReturnValue(false)

        renderGuard('/projects/200/users')

        expect(screen.getByRole('heading', { level: 1, name: 'Users' }))
            .toBeTruthy()
        expect(screen.getByText(PROJECT_ACCESS_DENIED_MESSAGE))
            .toBeTruthy()
        expect(screen.queryByText('Protected Project Users'))
            .toBeNull()
    })

    it('shows the project access denial message when the project fetch fails', () => {
        mockedUseFetchProject.mockReturnValue({
            error: new Error('Forbidden'),
            isLoading: false,
            mutate: jest.fn(),
            project: undefined,
        })
        mockedCheckProjectAccess.mockReturnValue(false)

        renderGuard('/projects/200/users')

        expect(mockedCheckProjectAccess)
            .toHaveBeenCalledWith(defaultContextValue.userRoles, 12345, undefined)
        expect(screen.getByText(PROJECT_ACCESS_DENIED_MESSAGE))
            .toBeTruthy()
        expect(screen.queryByText('Protected Project Users'))
            .toBeNull()
    })
})
