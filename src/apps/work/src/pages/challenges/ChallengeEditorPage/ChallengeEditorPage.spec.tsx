/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type {
    Context,
    PropsWithChildren,
    ReactNode,
} from 'react'
import {
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { useFetchChallenge } from '../../../lib/hooks'

import { ChallengeEditorPage } from './ChallengeEditorPage'

var mockWorkAppContext: Context<{
    isAdmin: boolean
    isAnonymous: boolean
    isCopilot: boolean
    isManager: boolean
    isReadOnly: boolean
    loginUserInfo: undefined
    userRoles: string[]
}>

jest.mock('~/apps/review/src/lib', () => ({
    PageWrapper: (
        props: PropsWithChildren<{
            pageTitle?: string
            rightHeader?: ReactNode
            titleAction?: ReactNode
        }>,
    ) => (
        <div>
            <h1>{props.pageTitle}</h1>
            <div data-testid='title-action'>{props.titleAction}</div>
            <div data-testid='right-header'>{props.rightHeader}</div>
            {props.children}
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
    }) => (
        <button
            disabled={props.disabled}
            onClick={props.onClick}
            type='button'
        >
            {props.label}
        </button>
    ),
    IconOutline: {
        ExternalLinkIcon: () => undefined,
    },
    Tooltip: (props: PropsWithChildren<Record<string, never>>) => (
        <div>{props.children}</div>
    ),
}), {
    virtual: true,
})
jest.mock('../../../lib/components', () => ({
    ChallengeStatus: (props: { statusText: string }) => (
        <div>{props.statusText}</div>
    ),
    ConfirmationModal: () => <div>Confirmation Modal</div>,
    ErrorMessage: (props: { message: string }) => <div>{props.message}</div>,
    LoadingSpinner: () => <div>Loading</div>,
}))
jest.mock('../../../lib/constants', () => ({
    CHALLENGE_STATUS: {
        ACTIVE: 'ACTIVE',
        CANCELLED_CLIENT_REQUEST: 'CANCELLED_CLIENT_REQUEST',
        CANCELLED_FAILED_REVIEW: 'CANCELLED_FAILED_REVIEW',
        CANCELLED_FAILED_SCREENING: 'CANCELLED_FAILED_SCREENING',
        CANCELLED_REQUIREMENTS_INFEASIBLE: 'CANCELLED_REQUIREMENTS_INFEASIBLE',
        CANCELLED_WINNER_UNRESPONSIVE: 'CANCELLED_WINNER_UNRESPONSIVE',
        CANCELLED_ZERO_REGISTRATIONS: 'CANCELLED_ZERO_REGISTRATIONS',
        CANCELLED_ZERO_SUBMISSIONS: 'CANCELLED_ZERO_SUBMISSIONS',
        COMPLETED: 'COMPLETED',
        DRAFT: 'DRAFT',
        NEW: 'NEW',
    },
    COMMUNITY_APP_URL: 'https://example.com/community',
    REVIEW_APP_URL: 'https://example.com/review',
}))
jest.mock('../../../lib/contexts', () => {
    const React = require('react') as typeof import('react')

    mockWorkAppContext = React.createContext<{
        isAdmin: boolean
        isAnonymous: boolean
        isCopilot: boolean
        isManager: boolean
        isReadOnly: boolean
        loginUserInfo: undefined
        userRoles: string[]
    }>({
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
    useFetchChallenge: jest.fn(),
    useFetchResourceRoles: jest.fn(() => ({
        resourceRoles: [],
    })),
    useFetchResources: jest.fn(() => ({
        isLoading: false,
        resources: [],
    })),
}))
jest.mock('../../../lib/services', () => ({
    deleteChallenge: jest.fn(),
    patchChallenge: jest.fn(),
}))
jest.mock('../../../lib/utils', () => ({
    extractErrorMessage: jest.fn(() => 'Error'),
    getStatusText: jest.fn((status?: string) => status || ''),
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))
jest.mock('./components', () => {
    const React = require('react') as typeof import('react')

    return {
        ChallengeEditorForm: (props: {
            isReadOnly?: boolean
            onRegisterLaunchAction?: (action: (() => Promise<void>) | undefined) => void
        }) => {
            React.useEffect(() => {
                if (!props.isReadOnly) {
                    props.onRegisterLaunchAction?.(async () => undefined)
                }
            }, [props.isReadOnly, props.onRegisterLaunchAction])

            return (
                <div>
                    {props.isReadOnly
                        ? 'Challenge View Form'
                        : 'Challenge Editor Form'}
                </div>
            )
        },
        ResourcesSection: () => <div>Resources Section</div>,
        SubmissionsSection: () => <div>Submissions Section</div>,
    }
})
jest.mock('./ChallengeEditorPage.utils', () => ({
    buildTaskWinnerPayload: jest.fn(() => []),
    getAssignedTaskMember: jest.fn(() => undefined),
    getCompleteTaskConfirmationMessage: jest.fn(() => ''),
    getTaskPrizeAmount: jest.fn(() => 0),
    isSelfAssignedCopilot: jest.fn(() => false),
    shouldShowCompleteTaskAction: jest.fn(() => false),
}))

const mockedUseFetchChallenge = useFetchChallenge as jest.Mock

function renderPage(route: string, path: string): void {
    const MockWorkAppContext = mockWorkAppContext

    render(
        <MockWorkAppContext.Provider value={{
            isAdmin: false,
            isAnonymous: false,
            isCopilot: false,
            isManager: true,
            isReadOnly: false,
            loginUserInfo: undefined,
            userRoles: ['manager'],
        }}
        >
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path={path} element={<ChallengeEditorPage />} />
                </Routes>
            </MemoryRouter>
        </MockWorkAppContext.Provider>,
    )
}

describe('ChallengeEditorPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                discussions: [{
                    url: 'https://example.com/forum/challenges/456',
                }],
                id: '456',
                name: 'Edit test',
                prizeSets: [],
                status: 'DRAFT',
            },
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })
    })

    it('renders the updated quick links in the right header for edit mode', async () => {
        renderPage(
            '/projects/123/challenges/456/edit',
            '/projects/:projectId/challenges/:challengeId/edit',
        )

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Launch' }))
                .toBeTruthy()
        })

        const titleAction = screen.getByTestId('title-action')
        const rightHeader = screen.getByTestId('right-header')
        const quickLinks = within(rightHeader)
            .getAllByRole('link')

        expect(within(titleAction)
            .queryByRole('link', { name: 'Challenge' }))
            .toBeNull()
        expect(quickLinks.map(link => link.textContent))
            .toEqual([
                'Challenge',
                'Review',
                'Forum',
            ])
        expect(within(rightHeader)
            .queryByRole('link', { name: 'Project' }))
            .toBeNull()
        expect(within(rightHeader)
            .getByRole('link', { name: 'Challenge' })
            .getAttribute('href'))
            .toBe('https://example.com/community/challenges/456')
        expect(within(rightHeader)
            .getByRole('link', { name: 'Review' })
            .getAttribute('href'))
            .toBe('https://example.com/review/active-challenges/456/challenge-details')
        expect(within(rightHeader)
            .getByRole('link', { name: 'Forum' })
            .getAttribute('href'))
            .toBe('https://example.com/forum/challenges/456')
    })

    it('renders a read-only challenge view with a header edit action', async () => {
        renderPage(
            '/projects/123/challenges/456/view',
            '/projects/:projectId/challenges/:challengeId/view',
        )

        await waitFor(() => {
            expect(screen.getByText('Challenge View Form'))
                .toBeTruthy()
        })

        expect(screen.getByRole('heading', { name: 'View Edit test' }))
            .toBeTruthy()
        expect(screen.queryByRole('button', { name: 'Launch' }))
            .toBeNull()
        expect(screen.getByRole('button', { name: 'Edit' }))
            .toBeTruthy()
    })
})
