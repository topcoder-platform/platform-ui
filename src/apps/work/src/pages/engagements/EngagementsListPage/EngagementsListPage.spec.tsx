/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { Context, PropsWithChildren, ReactNode } from 'react'
import {
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { WorkAppContextModel } from '../../../lib/models/WorkAppContextModel.model'
import {
    useFetchEngagements,
    useFetchProject,
} from '../../../lib/hooks'

import { EngagementsListPage } from './EngagementsListPage'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('~/apps/review/src/lib', () => ({
    PageWrapper: (props: PropsWithChildren<{ pageTitle?: string; titleAction?: ReactNode }>) => (
        <div>
            <h1>{props.pageTitle}</h1>
            {props.titleAction}
            {props.children}
        </div>
    ),
}), {
    virtual: true,
})
jest.mock('~/libs/ui', () => ({
    Button: (props: { label: string; onClick?: () => void }) => (
        <button onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
    IconOutline: {
        DocumentTextIcon: () => <span>document-icon</span>,
        PencilIcon: () => <span>pencil-icon</span>,
        UserIcon: () => <span>user-icon</span>,
    },
}), {
    virtual: true,
})
jest.mock('../../../lib/constants', () => ({
    ENGAGEMENTS_APP_URL: 'https://engagements.example.com',
    PAGE_SIZE: 10,
    PROJECT_STATUS: {
        ACTIVE: 'active',
    },
}))
jest.mock('../../../lib/components', () => ({
    EngagementsFilter: () => <div>Engagements Filter</div>,
    ErrorMessage: (props: { message: string }) => <div>{props.message}</div>,
    LoadingSpinner: () => <div>Loading</div>,
    Pagination: () => <div>Pagination</div>,
    ProjectBillingAccountExpiredNotice: () => <div>Billing Notice</div>,
    ProjectListTabs: () => <div>Project Tabs</div>,
    ProjectStatus: (props: { status: string }) => <div>{`Project Status: ${props.status}`}</div>,
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
    useFetchEngagements: jest.fn(),
    useFetchProject: jest.fn(),
}))
jest.mock('../../../lib/utils', () => ({
    canCreateEngagement: jest.fn(() => false),
    checkCanManageProject: jest.fn(() => false),
    formatEngagementStatus: jest.fn((status?: string) => status || ''),
    getApplicationsCount: jest.fn(() => 0),
    getAssignedMembersCount: jest.fn(() => 0),
}))

const mockedUseFetchEngagements = useFetchEngagements as jest.Mock
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

function renderPage(
    route: string,
    path: string,
    contextValue: WorkAppContextModel = defaultContextValue,
): void {
    const MockWorkAppContext = mockWorkAppContext

    render(
        <MockWorkAppContext.Provider value={contextValue}>
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path={path} element={<EngagementsListPage />} />
                </Routes>
            </MemoryRouter>
        </MockWorkAppContext.Provider>,
    )
}

describe('EngagementsListPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedUseFetchEngagements.mockReturnValue({
            engagements: [],
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: undefined,
        })
    })

    it('keeps the project name unchanged for project-scoped engagement tabs', () => {
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: {
                id: 200,
                name: 'Payment Testing',
                status: 'active',
            },
        })

        renderPage('/projects/200/engagements', '/projects/:projectId/engagements')

        expect(screen.getByRole('heading', { level: 1, name: 'Payment Testing' }))
            .toBeTruthy()
        expect(screen.queryByText('Payment Testing Engagements'))
            .toBeNull()
    })

    it('renders the project status badge in the project-scoped header actions', () => {
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: {
                id: 200,
                name: 'Payment Testing',
                status: 'active',
            },
        })

        renderPage('/projects/200/engagements', '/projects/:projectId/engagements')

        expect(screen.getByText('Project Status: active'))
            .toBeTruthy()
    })
})
