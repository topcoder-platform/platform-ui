/* eslint-disable no-var, global-require, @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type {
    Context,
    PropsWithChildren,
    ReactNode,
} from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import {
    useFetchChallenge,
    useFetchResourceRoles,
    useFetchResources,
} from '../../../lib/hooks'
import { deleteChallenge } from '../../../lib/services'
import {
    getAssignedTaskMember,
    shouldShowCompleteTaskAction,
} from './ChallengeEditorPage.utils'

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
        primary?: boolean
        secondary?: boolean
        size?: string
        variant?: string
    }) => (
        <button
            data-primary={props.primary
                ? 'true'
                : 'false'}
            data-secondary={props.secondary
                ? 'true'
                : 'false'}
            data-size={props.size}
            data-variant={props.variant}
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
    ChallengeStatus: (props: { status?: string; statusText?: string }) => (
        <div>{props.statusText || props.status}</div>
    ),
    ConfirmationModal: (props: {
        message?: string
        onCancel?: () => void
        onConfirm?: () => void
        title?: string
    }) => (
        <div>
            <div>{props.title}</div>
            <div>{props.message}</div>
            <button onClick={props.onCancel} type='button'>Cancel</button>
            <button onClick={props.onConfirm} type='button'>Confirm</button>
        </div>
    ),
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
            onChallengeCreated?: (challenge: {
                id: string
                name: string
                projectId: string
                status: string
            }) => void
            isReadOnly?: boolean
            onRegisterLaunchAction?: (action: (() => Promise<void>) | undefined) => void
        }) => {
            React.useEffect(() => {
                props.onRegisterLaunchAction?.(async () => undefined)
            }, [props.isReadOnly, props.onRegisterLaunchAction])
            const handleMockCreateChallenge = (): void => {
                props.onChallengeCreated?.({
                    id: '789',
                    name: 'Created challenge',
                    projectId: '123',
                    status: 'NEW',
                })
            }

            return (
                <div>
                    {props.isReadOnly
                        ? 'Challenge View Form'
                        : 'Challenge Editor Form'}
                    {!props.isReadOnly
                        ? (
                            <button
                                // eslint-disable-next-line react/jsx-no-bind
                                onClick={handleMockCreateChallenge}
                                type='button'
                            >
                                Mock create challenge
                            </button>
                        )
                        : undefined}
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
const mockedUseFetchResourceRoles = useFetchResourceRoles as jest.Mock
const mockedUseFetchResources = useFetchResources as jest.Mock
const mockedDeleteChallenge = deleteChallenge as jest.Mock
const mockedGetAssignedTaskMember = getAssignedTaskMember as jest.Mock
const mockedShouldShowCompleteTaskAction = shouldShowCompleteTaskAction as jest.Mock

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
        mockedUseFetchResourceRoles.mockReturnValue({
            resourceRoles: [],
        })
        mockedUseFetchResources.mockReturnValue({
            isLoading: false,
            resources: [],
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

        expect(screen.getByRole('button', { name: 'Cancel' }))
            .toBeTruthy()

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
        expect(
            screen.getByRole('button', { name: 'Cancel' })
                .getAttribute('data-secondary'),
        )
            .toBe('true')
        expect(
            screen.getByRole('button', { name: 'Cancel' })
                .getAttribute('data-size'),
        )
            .toBe('lg')
    })

    it('renders a read-only draft challenge view with cancel, launch, and edit header actions', async () => {
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
        expect(screen.getByRole('button', { name: 'Cancel' }))
            .toBeTruthy()
        expect(screen.getByRole('button', { name: 'Launch' }))
            .toBeTruthy()
        expect(screen.getByRole('button', { name: 'Edit' }))
            .toBeTruthy()
    })

    it('does not render a launch action for non-draft challenges in read-only view mode', async () => {
        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                discussions: [{
                    url: 'https://example.com/forum/challenges/456',
                }],
                id: '456',
                name: 'Active challenge',
                prizeSets: [],
                status: 'ACTIVE',
            },
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })

        renderPage(
            '/projects/123/challenges/456/view',
            '/projects/:projectId/challenges/:challengeId/view',
        )

        await waitFor(() => {
            expect(screen.getByText('Challenge View Form'))
                .toBeTruthy()
        })

        expect(screen.queryByRole('button', { name: 'Launch' }))
            .toBeNull()
        expect(screen.getByRole('button', { name: 'Edit' }))
            .toBeTruthy()
    })

    it('renders active header actions with the shared large secondary styling', async () => {
        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                discussions: [{
                    url: 'https://example.com/forum/challenges/456',
                }],
                id: '456',
                name: 'Active task test',
                prizeSets: [],
                status: 'ACTIVE',
            },
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })
        mockedShouldShowCompleteTaskAction.mockReturnValue(true)
        mockedGetAssignedTaskMember.mockReturnValue({
            handle: 'taskmember',
            userId: 12345,
        })

        renderPage(
            '/projects/123/challenges/456/edit',
            '/projects/:projectId/challenges/:challengeId/edit',
        )

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Cancel' }))
                .toBeTruthy()
        })

        expect(
            screen.getByRole('button', { name: 'Cancel' })
                .getAttribute('data-secondary'),
        )
            .toBe('true')
        expect(
            screen.getByRole('button', { name: 'Cancel' })
                .getAttribute('data-size'),
        )
            .toBe('lg')
        expect(
            screen.getByRole('button', { name: 'Mark Complete' })
                .getAttribute('data-secondary'),
        )
            .toBe('true')
        expect(
            screen.getByRole('button', { name: 'Mark Complete' })
                .getAttribute('data-size'),
        )
            .toBe('lg')
    })

    it('shows details, resources, and submissions tabs in read-only view mode', async () => {
        renderPage(
            '/projects/123/challenges/456/view',
            '/projects/:projectId/challenges/:challengeId/view',
        )

        await waitFor(() => {
            expect(screen.getByText('Challenge View Form'))
                .toBeTruthy()
        })

        expect(screen.getByRole('button', { name: 'Details' }))
            .toBeTruthy()
        expect(screen.getByRole('button', { name: 'Resources' }))
            .toBeTruthy()
        expect(screen.getByRole('button', { name: 'Submissions' }))
            .toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Resources' }))
        expect(screen.getByText('Resources Section'))
            .toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Submissions' }))
        expect(screen.getByText('Submissions Section'))
            .toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Details' }))
        expect(screen.getByText('Challenge View Form'))
            .toBeTruthy()
    })

    it('shows NEW status and delete action after a challenge is created on the create route', async () => {
        mockedUseFetchChallenge.mockReturnValue({
            challenge: undefined,
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })

        renderPage(
            '/projects/123/challenges/new',
            '/projects/:projectId/challenges/new',
        )

        fireEvent.click(screen.getByRole('button', { name: 'Mock create challenge' }))

        await waitFor(() => {
            expect(within(screen.getByTestId('title-action'))
                .getByText('NEW'))
                .toBeTruthy()
        })
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Delete' }))
                .toBeTruthy()
        })

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

        await waitFor(() => {
            expect(mockedDeleteChallenge)
                .toHaveBeenCalledWith('789')
        })
    })
})
