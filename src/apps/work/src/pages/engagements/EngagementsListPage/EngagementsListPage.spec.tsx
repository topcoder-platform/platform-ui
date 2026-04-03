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
    useFetchEngagements,
    useFetchProject,
    useFetchProjects,
} from '../../../lib/hooks'
import { deleteEngagement } from '../../../lib/services'
import {
    canCreateEngagement,
    canViewAllEngagements,
    checkTalentManager,
    formatEngagementStatus,
    showErrorToast,
    showSuccessToast,
} from '../../../lib/utils'

import { EngagementsListPage } from './EngagementsListPage'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('~/apps/review/src/lib', () => ({
    PageWrapper: (
        props: PropsWithChildren<{ pageTitle?: string; rightHeader?: ReactNode; titleAction?: ReactNode }>,
    ) => (
        <div>
            <div data-testid='page-right-header'>{props.rightHeader}</div>
            <h1>{props.pageTitle}</h1>
            {props.titleAction}
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
jest.mock('../../../lib/constants', () => ({
    ENGAGEMENTS_APP_URL: 'https://engagements.example.com',
    PAGE_SIZE: 10,
    PROJECT_STATUS: {
        ACTIVE: 'active',
    },
}))
jest.mock('../../../lib/components', () => ({
    ConfirmationModal: (props: {
        cancelText?: string
        confirmDisabled?: boolean
        confirmText?: string
        message: string
        onCancel: () => void
        onConfirm: () => void
        title: string
    }) => (
        <div role='dialog'>
            <h2>{props.title}</h2>
            <p>{props.message}</p>
            <button onClick={props.onCancel} type='button'>
                {props.cancelText || 'Cancel'}
            </button>
            <button
                disabled={props.confirmDisabled}
                onClick={props.onConfirm}
                type='button'
            >
                {props.confirmText || 'Confirm'}
            </button>
        </div>
    ),
    EngagementsFilter: function MockEngagementsFilter(props: {
        filters: { title?: string }
        onFiltersChange: (nextFilters: { title?: string }) => void
    }) {
        function handleApplyTitleFilter(): void {
            props.onFiltersChange({
                ...props.filters,
                title: 'test pro',
            })
        }

        return (
            <div>
                <button
                    type='button'
                    onClick={handleApplyTitleFilter}
                >
                    Apply title filter
                </button>
            </div>
        )
    },
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
    useFetchProjects: jest.fn(),
}))
jest.mock('../../../lib/services', () => ({
    deleteEngagement: jest.fn(),
}))
jest.mock('../../../lib/utils', () => ({
    canCreateEngagement: jest.fn(() => false),
    canViewAllEngagements: jest.fn((roles: string[] = []) => (
        roles.includes('administrator') || roles.includes('talent manager')
    )),
    checkCanManageProject: jest.fn(() => false),
    checkTalentManager: jest.fn((roles: string[] = []) => roles.includes('talent manager')),
    extractErrorMessage: jest.fn(
        (error: { message?: string } | undefined, fallback: string) => error?.message || fallback,
    ),
    formatEngagementStatus: jest.fn((status?: string) => status || ''),
    getApplicationsCount: jest.fn(() => 0),
    getAssignedMembersCount: jest.fn(() => 0),
    getEngagementStatusPillVariant: jest.fn(() => 'gray'),
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))

const mockedDeleteEngagement = deleteEngagement as jest.Mock
const mockedUseFetchEngagements = useFetchEngagements as jest.Mock
const mockedUseFetchProject = useFetchProject as jest.Mock
const mockedUseFetchProjects = useFetchProjects as jest.Mock
const mockedCanCreateEngagement = canCreateEngagement as jest.Mock
const mockedCanViewAllEngagements = canViewAllEngagements as jest.Mock
const mockedCheckTalentManager = checkTalentManager as jest.Mock
const mockedFormatEngagementStatus = formatEngagementStatus as jest.Mock
const mockedShowErrorToast = showErrorToast as jest.Mock
const mockedShowSuccessToast = showSuccessToast as jest.Mock

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

const copilotContextValue: WorkAppContextModel = {
    ...defaultContextValue,
    isAdmin: false,
    isCopilot: true,
    isManager: false,
    loginUserInfo: {
        ...defaultContextValue.loginUserInfo,
        roles: ['copilot'],
    } as WorkAppContextModel['loginUserInfo'],
    userRoles: ['copilot'],
}

const sampleEngagement = {
    anticipatedStart: 'IMMEDIATE',
    applications: [],
    assignedMemberHandles: [],
    assignments: [],
    compensationRange: '$1000-$2000',
    countries: [],
    createdAt: '2026-03-25T00:00:00.000Z',
    description: 'Engagement description',
    durationWeeks: 4,
    id: 111,
    isPrivate: true,
    projectId: 200,
    requiredMemberCount: 1,
    role: 'SOFTWARE_DEVELOPER',
    skills: [],
    status: 'Open',
    timezones: [],
    title: 'Test private mar 25',
    updatedAt: '2026-03-25T00:00:00.000Z',
    workload: 'FULL_TIME',
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

        mockedCanViewAllEngagements.mockImplementation((roles: string[] = []) => (
            roles.includes('administrator') || roles.includes('talent manager')
        ))
        mockedCheckTalentManager.mockImplementation((roles: string[] = []) => roles.includes('talent manager'))
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
        mockedUseFetchProjects.mockReturnValue({
            error: undefined,
            isLoading: false,
            isValidating: false,
            projects: [],
        })
        mockedDeleteEngagement.mockResolvedValue(undefined)
        mockedFormatEngagementStatus.mockImplementation((status?: string) => status || '')
    })

    it('blocks copilot users from opening project engagement routes directly', () => {
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: {
                id: 200,
                name: 'Payment Testing',
                status: 'active',
            },
        })

        renderPage('/projects/200/engagements', '/projects/:projectId/engagements', copilotContextValue)

        expect(screen.getByRole('heading', { level: 1, name: 'Payment Testing' }))
            .toBeTruthy()
        expect(screen.getByText('Project Tabs'))
            .toBeTruthy()
        expect(screen.getByText('You need Admin or Talent Manager role to view engagements.'))
            .toBeTruthy()
        expect(mockedUseFetchEngagements)
            .toHaveBeenLastCalledWith(
                '200',
                {
                    includePrivate: false,
                    projectId: '200',
                    projectIds: undefined,
                    sortBy: undefined,
                    sortOrder: undefined,
                    status: undefined,
                },
                {
                    enabled: false,
                },
            )
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

    it('renders create engagement in the page header and removes create challenge from the page', () => {
        mockedCanCreateEngagement.mockReturnValue(true)
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

        const pageRightHeader = screen.getByTestId('page-right-header')
        const pageContent = screen.getByTestId('page-content')
        const createEngagementButton = within(pageRightHeader)
            .getByRole('button', { name: 'Create Engagement' })

        expect(within(pageRightHeader)
            .queryByRole('button', { name: 'Create Challenge' }))
            .toBeNull()
        expect(screen.queryByRole('button', { name: 'Create Challenge' }))
            .toBeNull()
        expect(within(pageContent)
            .queryByRole('button', { name: 'Create Engagement' }))
            .toBeNull()
        expect(createEngagementButton.getAttribute('data-primary'))
            .toBe('true')
        expect(createEngagementButton.getAttribute('data-secondary'))
            .toBe('false')
    })

    it('keeps the name filter out of engagement fetch requests', async () => {
        renderPage('/engagements', '/engagements')

        fireEvent.click(screen.getByRole('button', { name: 'Apply title filter' }))

        await waitFor(() => {
            expect(mockedUseFetchEngagements)
                .toHaveBeenLastCalledWith(
                    undefined,
                    {
                        includePrivate: true,
                        projectId: undefined,
                        sortBy: 'anticipatedStart',
                        sortOrder: 'asc',
                        status: undefined,
                    },
                    {
                        enabled: true,
                    },
                )
        })
    })

    it('renders the engagement view link without the legacy opportunities path segment', () => {
        mockedUseFetchEngagements.mockReturnValue({
            engagements: [
                {
                    id: 'plJi6KV_jDjdtowUlQbFx',
                    isPrivate: false,
                    projectId: 200,
                    projectName: 'Payment Testing',
                    status: 'open',
                    title: 'Test engagement',
                },
            ],
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })

        renderPage('/engagements', '/engagements')

        expect(screen.getByRole('link', { name: 'View' })
            .getAttribute('href'))
            .toBe('https://engagements.example.com/plJi6KV_jDjdtowUlQbFx')
    })

    it('scopes all-engagements fetches to member projects for talent managers', async () => {
        mockedUseFetchProjects.mockReturnValue({
            error: undefined,
            isLoading: false,
            isValidating: false,
            projects: [
                {
                    id: 200,
                    name: 'Payment Testing',
                },
                {
                    id: '300',
                    name: 'API Rollout',
                },
            ],
        })

        renderPage('/engagements', '/engagements', talentManagerContextValue)

        await waitFor(() => {
            expect(mockedUseFetchProjects)
                .toHaveBeenCalledWith({
                    enabled: true,
                    memberOnly: true,
                })
            expect(mockedUseFetchEngagements)
                .toHaveBeenLastCalledWith(
                    undefined,
                    {
                        includePrivate: true,
                        projectId: undefined,
                        projectIds: ['200', '300'],
                        sortBy: 'anticipatedStart',
                        sortOrder: 'asc',
                        status: undefined,
                    },
                    {
                        enabled: true,
                    },
                )
        })
    })

    it('waits for talent manager project scope before loading all engagements', () => {
        mockedUseFetchProjects.mockReturnValue({
            error: undefined,
            isLoading: true,
            isValidating: false,
            projects: [],
        })

        renderPage('/engagements', '/engagements', talentManagerContextValue)

        expect(screen.getByText('Loading'))
            .toBeTruthy()
        expect(mockedUseFetchEngagements)
            .toHaveBeenLastCalledWith(
                undefined,
                {
                    includePrivate: true,
                    projectId: undefined,
                    projectIds: [],
                    sortBy: 'anticipatedStart',
                    sortOrder: 'asc',
                    status: undefined,
                },
                {
                    enabled: false,
                },
            )
    })

    it('renders delete actions for admins on the all engagements page', () => {
        mockedUseFetchEngagements.mockReturnValue({
            engagements: [sampleEngagement],
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })

        renderPage('/engagements', '/engagements')

        const row = screen.getByText(sampleEngagement.title)
            .closest('tr') as HTMLTableRowElement

        expect(within(row)
            .getByRole('button', { name: 'Delete' }))
            .toBeTruthy()
    })

    it('does not render delete actions for non-admin talent managers', () => {
        mockedUseFetchEngagements.mockReturnValue({
            engagements: [sampleEngagement],
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })

        renderPage('/engagements', '/engagements', talentManagerContextValue)

        const row = screen.getByText(sampleEngagement.title)
            .closest('tr') as HTMLTableRowElement

        expect(within(row)
            .queryByRole('button', { name: 'Delete' }))
            .toBeNull()
    })

    it('blocks project managers from opening project engagement routes directly', () => {
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: {
                id: 200,
                name: 'Payment Testing',
                status: 'active',
            },
        })
        mockedUseFetchEngagements.mockReturnValue({
            engagements: [sampleEngagement],
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })

        renderPage('/projects/200/engagements', '/projects/:projectId/engagements', projectManagerContextValue)

        expect(screen.getByRole('heading', { level: 1, name: 'Payment Testing' }))
            .toBeTruthy()
        expect(screen.getByText('Project Tabs'))
            .toBeTruthy()
        expect(screen.getByText('You need Admin or Talent Manager role to view engagements.'))
            .toBeTruthy()
        expect(screen.queryByText(sampleEngagement.title))
            .toBeNull()
        expect(mockedUseFetchEngagements)
            .toHaveBeenLastCalledWith(
                '200',
                {
                    includePrivate: false,
                    projectId: '200',
                    projectIds: undefined,
                    sortBy: undefined,
                    sortOrder: undefined,
                    status: undefined,
                },
                {
                    enabled: false,
                },
            )
        expect(mockedUseFetchProject)
            .toHaveBeenCalledWith('200')
    })

    it('deletes the selected engagement and refreshes the list', async () => {
        const mutate = jest.fn()
            .mockResolvedValue(undefined)

        mockedUseFetchEngagements.mockReturnValue({
            engagements: [sampleEngagement],
            error: undefined,
            isLoading: false,
            mutate,
        })

        renderPage('/engagements', '/engagements')

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

        const confirmationDialog = screen.getByRole('dialog')
        fireEvent.click(within(confirmationDialog)
            .getByRole('button', { name: 'Delete' }))

        await waitFor(() => {
            expect(mockedDeleteEngagement)
                .toHaveBeenCalledWith(sampleEngagement.id)
            expect(mutate)
                .toHaveBeenCalled()
        })
        expect(mockedShowSuccessToast)
            .toHaveBeenCalledWith('Engagement deleted successfully.')
        expect(mockedShowErrorToast)
            .not.toHaveBeenCalled()
    })
})
