/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { Context, PropsWithChildren } from 'react'
import {
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { WorkAppContextModel } from '../../../lib/models/WorkAppContextModel.model'
import {
    useFetchEngagement,
    useFetchProject,
} from '../../../lib/hooks'
import { canCreateEngagement } from '../../../lib/utils'

import { EngagementEditorPage } from './EngagementEditorPage'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('~/apps/review/src/lib', () => ({
    PageWrapper: (props: PropsWithChildren<{ pageTitle?: string }>) => (
        <div>
            <h1>{props.pageTitle}</h1>
            {props.children}
        </div>
    ),
}), {
    virtual: true,
})
jest.mock('../../../lib/components', () => ({
    ErrorMessage: (props: { message: string }) => <div>{props.message}</div>,
    LoadingSpinner: () => <div>Loading</div>,
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
    useFetchEngagement: jest.fn(),
    useFetchProject: jest.fn(),
}))
jest.mock('../../../lib/utils', () => ({
    canCreateEngagement: jest.fn((roles: string[] = []) => (
        roles.includes('administrator') || roles.includes('talent manager')
    )),
}))
jest.mock('./components', () => ({
    EngagementEditorForm: (props: { projectId: string }) => (
        <div>{`Engagement Form ${props.projectId}`}</div>
    ),
}))

const mockedCanCreateEngagement = canCreateEngagement as jest.Mock
const mockedUseFetchEngagement = useFetchEngagement as jest.Mock
const mockedUseFetchProject = useFetchProject as jest.Mock

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

const projectManagerContextValue: WorkAppContextModel = {
    ...defaultContextValue,
    isAdmin: false,
    isManager: true,
    loginUserInfo: {
        ...defaultContextValue.loginUserInfo,
        roles: ['project manager'],
    } as WorkAppContextModel['loginUserInfo'],
    userRoles: ['project manager'],
}

const talentManagerContextValue: WorkAppContextModel = {
    ...defaultContextValue,
    isAdmin: false,
    isManager: true,
    loginUserInfo: {
        ...defaultContextValue.loginUserInfo,
        roles: ['talent manager'],
    } as WorkAppContextModel['loginUserInfo'],
    userRoles: ['talent manager'],
}

function renderPage(
    route: string,
    path: string,
    contextValue: WorkAppContextModel,
): void {
    const MockWorkAppContext = mockWorkAppContext

    render(
        <MockWorkAppContext.Provider value={contextValue}>
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path={path} element={<EngagementEditorPage />} />
                </Routes>
            </MemoryRouter>
        </MockWorkAppContext.Provider>,
    )
}

describe('EngagementEditorPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedCanCreateEngagement.mockImplementation((roles: string[] = []) => (
            roles.includes('administrator') || roles.includes('talent manager')
        ))
        mockedUseFetchEngagement.mockReturnValue({
            engagement: undefined,
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        })
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
            project: undefined,
        })
    })

    it('blocks project managers from opening engagement edit routes', () => {
        renderPage(
            '/projects/123/engagements/engagement-1',
            '/projects/:projectId/engagements/:engagementId',
            projectManagerContextValue,
        )

        expect(screen.getByText('You need Admin or Talent Manager role to view engagements.'))
            .toBeTruthy()
        expect(screen.queryByText('Engagement Form 123'))
            .toBeNull()
        expect(mockedUseFetchEngagement)
            .toHaveBeenCalledWith(undefined)
        expect(mockedUseFetchProject)
            .toHaveBeenCalledWith(undefined)
    })

    it('renders the editor for talent managers on create routes', () => {
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
            project: {
                id: '123',
                name: 'Payment Testing',
            },
        })

        renderPage(
            '/projects/123/engagements/new',
            '/projects/:projectId/engagements/new',
            talentManagerContextValue,
        )

        expect(screen.getByRole('heading', { level: 1, name: 'Create Engagement (Payment Testing)' }))
            .toBeTruthy()
        expect(screen.getByText('Engagement Form 123'))
            .toBeTruthy()
        expect(mockedUseFetchProject)
            .toHaveBeenCalledWith('123')
    })
})
