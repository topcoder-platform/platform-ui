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
import {
    canCreateEngagement,
    canViewAllEngagements,
} from '../../../lib/utils'

import { EngagementDetailsPage } from './EngagementDetailsPage'

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
jest.mock('~/libs/ui', () => ({
    Button: (props: {
        label: string
        onClick?: () => void
    }) => (
        <button onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
    IconOutline: {
        ExternalLinkIcon: () => <span>external-link-icon</span>,
    },
}), {
    virtual: true,
})
jest.mock('../../../lib/constants', () => ({
    ENGAGEMENTS_APP_URL: 'https://engagements.example.com',
}))
jest.mock('../../../config/routes.config', () => ({
    rootRoute: '/work',
}))
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
    canViewAllEngagements: jest.fn((roles: string[] = []) => (
        roles.includes('administrator') || roles.includes('talent manager')
    )),
    formatAnticipatedStart: () => 'Immediate',
    formatDate: () => 'Jul 15, 2026',
    formatDuration: () => '8 weeks',
    formatEngagementStatus: () => 'Open',
    formatLocation: () => 'Remote',
}))

const mockedCanCreateEngagement = canCreateEngagement as jest.Mock
const mockedCanViewAllEngagements = canViewAllEngagements as jest.Mock
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

function renderPage(): void {
    const MockWorkAppContext = mockWorkAppContext

    render(
        <MockWorkAppContext.Provider value={defaultContextValue}>
            <MemoryRouter initialEntries={['/projects/200/engagements/111/view']}>
                <Routes>
                    <Route
                        element={<EngagementDetailsPage />}
                        path='/projects/:projectId/engagements/:engagementId/view'
                    />
                </Routes>
            </MemoryRouter>
        </MockWorkAppContext.Provider>,
    )
}

describe('EngagementDetailsPage', () => {
    beforeEach(() => {
        mockedCanCreateEngagement.mockImplementation((roles: string[] = []) => (
            roles.includes('administrator') || roles.includes('talent manager')
        ))
        mockedCanViewAllEngagements.mockImplementation((roles: string[] = []) => (
            roles.includes('administrator') || roles.includes('talent manager')
        ))
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: {
                id: 200,
                name: 'Payment Testing',
            },
        })
        mockedUseFetchEngagement.mockReturnValue({
            engagement: {
                account: 'Acme Corp',
                anticipatedStart: 'IMMEDIATE',
                assignedMemberHandles: [],
                assignments: [],
                compensationRange: '$600 - $1000',
                countries: [],
                description: '<p>Engagement description</p>',
                durationWeeks: 8,
                id: '111',
                isPrivate: false,
                projectId: 200,
                projectName: 'Payment Testing',
                receivedDateFromAccount: '2026-07-15T00:00:00.000Z',
                requiredMemberCount: 1,
                role: 'SOFTWARE_DEVELOPER',
                roleLevel: 'SENIOR',
                skills: [{ id: '1', name: 'React' }],
                smu: 'North America',
                spoc: 'Jane Doe',
                status: 'OPEN',
                timezones: [],
                title: 'Frontend Engagement',
                workload: 'FULL_TIME',
            },
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        })
    })

    it('renders engagement details and portal view post link', () => {
        renderPage()

        expect(screen.getByRole('heading', { name: 'Frontend Engagement' }))
            .toBeTruthy()
        expect(screen.getByText('Software Developer'))
            .toBeTruthy()
        expect(screen.getByText('React'))
            .toBeTruthy()
        expect(screen.getByText('Acme Corp'))
            .toBeTruthy()
        expect(screen.getByText('North America'))
            .toBeTruthy()
        expect(screen.getByText('Jane Doe'))
            .toBeTruthy()
        expect(screen.getByText('Senior'))
            .toBeTruthy()
        expect(screen.getByText('Jul 15, 2026'))
            .toBeTruthy()
        expect(screen.getByRole('button', { name: 'Edit' }))
            .toBeTruthy()
        expect(screen.getByRole('link', { name: /View Post/i })
            .getAttribute('href'))
            .toBe('https://engagements.example.com/111')
        expect(screen.getByRole('link', { name: /View Post/i })
            .getAttribute('target'))
            .toBe('_blank')
    })
})
