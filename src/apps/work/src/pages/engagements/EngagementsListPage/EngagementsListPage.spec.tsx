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
} from '../../../lib/hooks'
import { deleteEngagement } from '../../../lib/services'
import {
    canCreateEngagement,
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
jest.mock('../../../lib/services', () => ({
    deleteEngagement: jest.fn(),
}))
jest.mock('../../../lib/utils', () => ({
    canCreateEngagement: jest.fn(() => false),
    checkCanManageProject: jest.fn(() => false),
    extractErrorMessage: jest.fn(
        (error: { message?: string } | undefined, fallback: string) => error?.message || fallback,
    ),
    formatEngagementStatus: jest.fn((status?: string) => status || ''),
    getApplicationsCount: jest.fn(() => 0),
    getAssignedMembersCount: jest.fn(() => 0),
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))

const mockedDeleteEngagement = deleteEngagement as jest.Mock
const mockedUseFetchEngagements = useFetchEngagements as jest.Mock
const mockedUseFetchProject = useFetchProject as jest.Mock
const mockedCanCreateEngagement = canCreateEngagement as jest.Mock
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

const managerContextValue: WorkAppContextModel = {
    ...defaultContextValue,
    isAdmin: false,
    isManager: true,
    loginUserInfo: {
        ...defaultContextValue.loginUserInfo,
        roles: ['manager'],
    } as WorkAppContextModel['loginUserInfo'],
    userRoles: ['manager'],
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
        mockedDeleteEngagement.mockResolvedValue(undefined)
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

    it('does not render delete actions for non-admin managers', () => {
        mockedUseFetchEngagements.mockReturnValue({
            engagements: [sampleEngagement],
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })

        renderPage('/engagements', '/engagements', managerContextValue)

        const row = screen.getByText(sampleEngagement.title)
            .closest('tr') as HTMLTableRowElement

        expect(within(row)
            .queryByRole('button', { name: 'Delete' }))
            .toBeNull()
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
