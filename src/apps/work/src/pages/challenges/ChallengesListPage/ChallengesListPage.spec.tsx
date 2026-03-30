/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { Context, PropsWithChildren } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { WorkAppContextModel } from '../../../lib/models/WorkAppContextModel.model'
import {
    useFetchChallengeTypes,
    useFetchChallenges,
    useFetchProject,
    useFetchProjects,
} from '../../../lib/hooks'

import { ChallengesListPage } from './ChallengesListPage'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('~/apps/admin/src/lib', () => ({
    TableLoading: () => <div>Loading</div>,
}), {
    virtual: true,
})
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
jest.mock('../../../lib', () => ({
    PAGE_SIZE: 10,
    PROJECT_STATUS: {
        ACTIVE: 'active',
    },
}))
jest.mock('../../../lib/components', () => ({
    ChallengesFilter: () => <div>Challenges Filter</div>,
    ChallengesTable: () => <div>Challenges Table</div>,
    Pagination: () => <div>Pagination</div>,
    ProjectBillingAccountExpiredNotice: () => <div>Billing Notice</div>,
    ProjectListTabs: () => <div>Project Tabs</div>,
    ProjectStatus: () => <div>Project Status</div>,
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
    useFetchChallenges: jest.fn(),
    useFetchChallengeTypes: jest.fn(),
    useFetchProject: jest.fn(),
    useFetchProjects: jest.fn(),
}))
jest.mock('../../../lib/utils', () => ({
    canCreateEngagement: jest.fn(() => false),
    checkCanManageProject: jest.fn(() => false),
    getStatusText: jest.fn((status?: string) => status || ''),
}))

const mockedUseFetchChallenges = useFetchChallenges as jest.Mock
const mockedUseFetchChallengeTypes = useFetchChallengeTypes as jest.Mock
const mockedUseFetchProject = useFetchProject as jest.Mock
const mockedUseFetchProjects = useFetchProjects as jest.Mock

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
                    <Route path={path} element={<ChallengesListPage />} />
                </Routes>
            </MemoryRouter>
        </MockWorkAppContext.Provider>,
    )
}

describe('ChallengesListPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedUseFetchChallenges.mockReturnValue({
            challenges: [],
            error: undefined,
            isLoading: false,
            isValidating: false,
            metadata: {
                page: 1,
                perPage: 10,
                total: 0,
                totalPages: 0,
            },
            mutate: jest.fn(),
        })
        mockedUseFetchChallengeTypes.mockReturnValue({
            challengeTypes: [],
            error: undefined,
            isLoading: false,
        })
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: undefined,
        })
        mockedUseFetchProjects.mockReturnValue({
            error: undefined,
            isLoading: false,
            projects: [],
        })
    })

    it('scopes dashboard challenge queries to the logged-in member for non-privileged users', () => {
        renderPage('/challenges', '/challenges')

        expect(mockedUseFetchChallenges)
            .toHaveBeenCalledWith(expect.objectContaining({
                memberId: 12345,
                projectId: undefined,
            }))
    })

    it('does not scope project challenge queries by member id', () => {
        renderPage('/projects/200/challenges', '/projects/:projectId/challenges')

        const fetchParams = mockedUseFetchChallenges.mock.calls[0][0]

        expect(fetchParams.projectId)
            .toBe('200')
        expect(fetchParams.memberId)
            .toBeUndefined()
    })
})
