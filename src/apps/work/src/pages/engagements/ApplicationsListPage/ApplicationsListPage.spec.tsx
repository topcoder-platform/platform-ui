/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type {
    ChangeEvent,
    Context,
    PropsWithChildren,
    ReactNode,
} from 'react'
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type {
    Application,
    WorkAppContextModel,
} from '../../../lib/models'
import {
    useFetchApplications,
    useFetchEngagement,
} from '../../../lib/hooks'

import { ApplicationsListPage } from './ApplicationsListPage'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('react-select', () => {
    const MockSelect = (props: {
        inputId?: string
        isDisabled?: boolean
        onChange?: (value?: { label: string; value: string }) => void
        options: Array<{ label: string; value: string }>
        value?: { label: string; value: string }
    }): JSX.Element => {
        const handleChange = (event: ChangeEvent<HTMLSelectElement>): void => {
            const nextOption = props.options.find(option => option.value === event.target.value)

            props.onChange?.(nextOption)
        }

        return (
            <select
                disabled={props.isDisabled}
                id={props.inputId}
                onChange={handleChange}
                value={props.value?.value || ''}
            >
                {props.options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        )
    }

    return MockSelect
})
jest.mock('~/apps/review/src/lib', () => ({
    PageWrapper: (
        props: PropsWithChildren<{ pageTitle?: string; rightHeader?: ReactNode }>,
    ): JSX.Element => (
        <div>
            <h1>{props.pageTitle}</h1>
            <div>{props.rightHeader}</div>
            <div>{props.children}</div>
        </div>
    ),
}), {
    virtual: true,
})
jest.mock('~/libs/ui', () => ({
    BaseModal: (props: PropsWithChildren<{ open: boolean }>): JSX.Element => (
        props.open
            ? <div>{props.children}</div>
            : <></>
    ),
    Button: (props: {
        label: string
        onClick?: () => void
    }): JSX.Element => (
        <button onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
    IconOutline: {
        CheckCircleIcon: (): JSX.Element => <span>active-icon</span>,
    },
}), {
    virtual: true,
})
jest.mock('../../../lib/constants', () => ({
    APPLICATION_STATUSES: ['SUBMITTED', 'UNDER_REVIEW', 'SELECTED', 'REJECTED'],
    PROFILE_URL: 'https://profiles.example.com',
}))
jest.mock('../../../lib/components', () => ({
    AcceptApplicationModal: (): JSX.Element => <></>,
    ApplicationDetailModal: (): JSX.Element => <></>,
    ErrorMessage: (props: { message: string }): JSX.Element => <div>{props.message}</div>,
    LoadingSpinner: (): JSX.Element => <div>Loading</div>,
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
    useFetchApplications: jest.fn(),
    useFetchEngagement: jest.fn(),
}))
jest.mock('../../../lib/services', () => ({
    approveApplication: jest.fn(),
    updateApplicationStatus: jest.fn(),
}))
jest.mock('../../../lib/utils', () => ({
    formatAnticipatedStart: jest.fn(() => 'In a few weeks'),
    formatEngagementStatus: jest.fn(() => 'Open'),
    getEngagementStatusPillVariant: jest.fn(() => 'yellow'),
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))

const mockedUseFetchApplications = useFetchApplications as jest.Mock
const mockedUseFetchEngagement = useFetchEngagement as jest.Mock

const applications: Application[] = [
    {
        address: 'Address 1',
        availability: 'Immediate',
        createdAt: '2026-03-31T15:39:00.000Z',
        email: 'submitted@example.com',
        engagementId: 'engagement-1',
        handle: 'submitted-user',
        id: 'application-1',
        name: 'Submitted User',
        status: 'SUBMITTED',
        userId: '101',
        yearsOfExperience: 4,
    },
    {
        address: 'Address 2',
        availability: 'Two weeks',
        createdAt: '2026-03-31T15:39:00.000Z',
        email: 'review@example.com',
        engagementId: 'engagement-1',
        handle: 'review-user',
        id: 'application-2',
        name: 'Review User',
        status: 'UNDER_REVIEW',
        userId: '102',
        yearsOfExperience: 7,
    },
]

function renderPage(): void {
    const MockWorkAppContext = mockWorkAppContext

    render(
        <MockWorkAppContext.Provider
            value={{
                isAdmin: false,
                isAnonymous: false,
                isCopilot: false,
                isManager: false,
                isReadOnly: false,
                loginUserInfo: undefined,
                userRoles: [],
            }}
        >
            <MemoryRouter initialEntries={['/projects/project-1/engagements/engagement-1/applications']}>
                <Routes>
                    <Route
                        element={<ApplicationsListPage />}
                        path='/projects/:projectId/engagements/:engagementId/applications'
                    />
                </Routes>
            </MemoryRouter>
        </MockWorkAppContext.Provider>,
    )
}

describe('ApplicationsListPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedUseFetchEngagement.mockReturnValue({
            engagement: {
                anticipatedStart: 'FEW_WEEKS',
                assignments: [],
                status: 'OPEN',
                title: 'Engagement Alpha',
            },
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })
        mockedUseFetchApplications.mockReturnValue({
            applications,
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })
    })

    it('filters the rendered applications by the selected status', () => {
        renderPage()

        expect(screen.getByText('Submitted User'))
            .toBeTruthy()
        expect(screen.getByText('Review User'))
            .toBeTruthy()

        fireEvent.change(screen.getByLabelText('Status'), {
            target: { value: 'UNDER_REVIEW' },
        })

        expect(screen.queryByText('Submitted User'))
            .toBeNull()
        expect(screen.getByText('Review User'))
            .toBeTruthy()
    })
})
