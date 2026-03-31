/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { Context, PropsWithChildren, ReactNode } from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { WorkAppContextModel } from '../../../lib/models/WorkAppContextModel.model'
import {
    useFetchChallengeTypes,
    useFetchChallenges,
    useFetchProject,
    useFetchProjects,
} from '../../../lib/hooks'
import { canCreateEngagement } from '../../../lib/utils'

import { ChallengesListPage } from './ChallengesListPage'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('~/apps/admin/src/lib', () => ({
    TableLoading: () => <div>Loading</div>,
}), {
    virtual: true,
})
jest.mock('~/apps/review/src/lib', () => ({
    PageWrapper: (
        props: PropsWithChildren<{ pageTitle?: string; rightHeader?: ReactNode; titleAction?: ReactNode }>,
    ) => (
        <div>
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
        disabled?: boolean
        label: string
        onClick?: () => void
        primary?: boolean
        secondary?: boolean
    }) => (
        <button
            data-primary={props.primary ? 'true' : 'false'}
            data-secondary={props.secondary ? 'true' : 'false'}
            disabled={props.disabled}
            onClick={props.onClick}
            type='button'
        >
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
    COPILOTS_APP_URL: 'https://copilots.example.com',
    PAGE_SIZE: 10,
    PROJECT_STATUS: {
        ACTIVE: 'active',
        CANCELLED: 'cancelled',
        COMPLETED: 'completed',
    },
}))
jest.mock('../../../lib/components', () => ({
    ChallengesFilter: (props: { onResetFilters?: () => void }) => (
        <button onClick={props.onResetFilters} type='button'>
            Reset Filters
        </button>
    ),
    ChallengesTable: () => <div>Challenges Table</div>,
    Pagination: (props: { onPerPageChange: (perPage: number) => void }) => {
        function handlePerPageChange(): void {
            props.onPerPageChange(25)
        }

        return (
            <button onClick={handlePerPageChange} type='button'>
                Rows 25
            </button>
        )
    },
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
const mockedCanCreateEngagement = canCreateEngagement as jest.Mock

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

function getLastFetchChallengesParams(): Record<string, unknown> {
    return mockedUseFetchChallenges.mock.calls[mockedUseFetchChallenges.mock.calls.length - 1][0]
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

    it('resets rows per page to the default value when filters are reset', async () => {
        mockedUseFetchChallenges.mockReturnValue({
            challenges: [],
            error: undefined,
            isLoading: false,
            isValidating: false,
            metadata: {
                page: 1,
                perPage: 10,
                total: 30,
                totalPages: 3,
            },
            mutate: jest.fn(),
        })

        renderPage('/challenges', '/challenges')

        fireEvent.click(screen.getByRole('button', { name: 'Rows 25' }))

        await waitFor(() => {
            expect(getLastFetchChallengesParams())
                .toEqual(expect.objectContaining({
                    page: 1,
                    perPage: 25,
                }))
        })

        fireEvent.click(screen.getByRole('button', { name: 'Reset Filters' }))

        await waitFor(() => {
            expect(getLastFetchChallengesParams())
                .toEqual(expect.objectContaining({
                    page: 1,
                    perPage: 10,
                }))
        })
    })

    it('renders the challenge count before project actions and keeps create engagement in the header', () => {
        mockedCanCreateEngagement.mockReturnValue(true)
        mockedUseFetchChallenges.mockReturnValue({
            challenges: [],
            error: undefined,
            isLoading: false,
            isValidating: false,
            metadata: {
                page: 1,
                perPage: 10,
                total: 1,
                totalPages: 1,
            },
            mutate: jest.fn(),
        })
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: {
                billingAccountId: 80001059,
                billingAccountName: 'Platform Dev - Two',
                id: 200,
                name: 'Payment Testing',
                status: 'active',
            },
        })

        renderPage(
            '/projects/200/challenges',
            '/projects/:projectId/challenges',
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

        const pageRightHeader = screen.getByTestId('page-right-header')
        const pageContent = screen.getByTestId('page-content')
        const projectTabs = within(pageContent)
            .getByText('Project Tabs')
        const totalChallenges = within(pageContent)
            .getByText('1 challenges')
        const requestCopilotLink = within(pageContent)
            .getByRole('link', { name: 'Request Copilot' })
        const createChallengeButton = within(pageContent)
            .getByRole('button', { name: 'Create Challenge' })
        const createEngagementButton = within(pageRightHeader)
            .getByRole('button', { name: 'Create Engagement' })

        expect(within(pageRightHeader)
            .queryByRole('button', { name: 'Create Challenge' }))
            .toBeNull()
        expect(createChallengeButton.getAttribute('data-primary'))
            .toBe('true')
        expect(createChallengeButton.getAttribute('data-secondary'))
            .toBe('false')
        expect(createEngagementButton.getAttribute('data-primary'))
            .toBe('false')
        expect(createEngagementButton.getAttribute('data-secondary'))
            .toBe('true')
        expect(projectTabs.compareDocumentPosition(requestCopilotLink))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
        expect(totalChallenges.compareDocumentPosition(requestCopilotLink))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
        expect(projectTabs.compareDocumentPosition(createChallengeButton))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
        expect(totalChallenges.compareDocumentPosition(createChallengeButton))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
        expect(requestCopilotLink.compareDocumentPosition(createChallengeButton))
            .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    })
})
