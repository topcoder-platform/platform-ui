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
import userEvent from '@testing-library/user-event'

import {
    useFetchChallenge,
    useFetchProject,
    useFetchResourceRoles,
    useFetchResources,
    type UseFetchChallengeResult,
} from '../../../lib/hooks'
import type { WorkAppContextModel } from '../../../lib/models'
import {
    deleteChallenge,
    patchChallenge,
} from '../../../lib/services'
import {
    checkProjectAccess,
    isChallengeCompletedOrCancelled,
} from '../../../lib/utils'
import {
    getAssignedTaskMember,
    shouldShowCompleteTaskAction,
} from './ChallengeEditorPage.utils'

import { ChallengeEditorPage } from './ChallengeEditorPage'

var mockWorkAppContext: Context<WorkAppContextModel>

jest.mock('tc-auth-lib', () => ({
    decodeToken: jest.fn(),
}))

jest.mock('../../../lib/services/resources.service', () => ({
    fetchResourceRoles: jest.fn(),
    fetchResources: jest.fn(),
}))

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
    CHALLENGE_APPROVAL_STATUS: {
        APPROVED: 'APPROVED',
        PENDING_APPROVAL: 'PENDING_APPROVAL',
        REJECTED: 'REJECTED',
    },
    CHALLENGE_STATUS: {
        ACTIVE: 'ACTIVE',
        APPROVED: 'APPROVED',
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
    IS_TEST_CHALLENGE_METADATA_FIELD: 'is_test_challenge',
    PROJECT_ROLES: {
        COPILOT: 'copilot',
        CUSTOMER: 'customer',
        MANAGER: 'manager',
        READ: 'observer',
        WRITE: 'customer',
    },
    REVIEW_APP_URL: 'https://example.com/review',
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
    useFetchChallenge: jest.fn(),
    useFetchProject: jest.fn(),
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
    canModifyChallenge: jest.requireActual('../../../lib/utils/permissions.utils').canModifyChallenge,
    checkProjectAccess: jest.fn(() => true),
    extractErrorMessage: jest.fn(() => 'Error'),
    getStatusText: jest.fn((status?: string) => status || ''),
    isChallengeCompletedOrCancelled: jest.fn(),
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))
jest.mock('./components', () => {
    const React = require('react') as typeof import('react')

    return {
        ChallengeEditorForm: (props: {
            footerCancelAction?: ReactNode
            isEditMode?: boolean
            onChallengeCreated?: (challenge: {
                id: string
                name: string
                projectId: string
                status: string
            }) => void
            onChallengeApprovalStatusChange?: (status?: string) => void
            onChallengeStatusChange?: (status?: string) => void
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
                <div
                    data-edit-mode={props.isEditMode
                        ? 'true'
                        : 'false'}
                    data-testid='challenge-editor-form'
                >
                    {props.isReadOnly
                        ? 'Challenge View Form'
                        : 'Challenge Editor Form'}
                    {props.footerCancelAction}
                    <button
                        onClick={function handleChallengeApproval() {
                            props.onChallengeApprovalStatusChange?.('APPROVED')
                        }}
                        type='button'
                    >
                        Mock approve budget
                    </button>
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
                    {!props.isReadOnly
                        ? (
                            <button
                                onClick={function handleChallengeStatusChange() {
                                    props.onChallengeStatusChange?.('DRAFT')
                                }}
                                type='button'
                            >
                                Mock save as draft
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
    ...jest.requireActual('./ChallengeEditorPage.utils'),
    buildTaskWinnerPayload: jest.fn(() => []),
    getAssignedTaskMember: jest.fn(() => undefined),
    getCompleteTaskConfirmationMessage: jest.fn(() => ''),
    getTaskPrizeAmount: jest.fn(() => 0),
    isSelfAssignedCopilot: jest.fn(() => false),
    shouldShowCompleteTaskAction: jest.fn(() => false),
}))

const mockedUseFetchChallenge = useFetchChallenge as jest.Mock
const mockedUseFetchProject = useFetchProject as jest.Mock
const mockedUseFetchResourceRoles = useFetchResourceRoles as jest.Mock
const mockedUseFetchResources = useFetchResources as jest.Mock
const mockedDeleteChallenge = deleteChallenge as jest.Mock
const mockedPatchChallenge = patchChallenge as jest.Mock
const mockedCheckProjectAccess = checkProjectAccess as jest.Mock
const mockedIsChallengeCompletedOrCancelled = isChallengeCompletedOrCancelled as jest.Mock
const mockedGetAssignedTaskMember = getAssignedTaskMember as jest.Mock
const mockedShouldShowCompleteTaskAction = shouldShowCompleteTaskAction as jest.Mock

/**
 * Builds the routed challenge editor test tree.
 *
 * @param route concrete route used as the initial memory history entry.
 * @param path route pattern registered for the page under test.
 * @returns the challenge editor element wrapped with router and work context providers.
 */
function renderPageElement(route: string, path: string): JSX.Element {
    const MockWorkAppContext = mockWorkAppContext

    return (
        <MockWorkAppContext.Provider value={{
            isAdmin: false,
            isAnonymous: false,
            isCopilot: false,
            isManager: true,
            isReadOnly: false,
            loginUserInfo: {
                handle: 'current-user',
                roles: ['manager'],
                userId: 12345,
            },
            userRoles: ['manager'],
        }}
        >
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path={path} element={<ChallengeEditorPage />} />
                </Routes>
            </MemoryRouter>
        </MockWorkAppContext.Provider>
    )
}

/**
 * Renders the challenge editor page in a memory router for route-level assertions.
 *
 * @param route concrete route used as the initial memory history entry.
 * @param path route pattern registered for the page under test.
 * @returns the React Testing Library render result.
 */
function renderPage(route: string, path: string): ReturnType<typeof render> {
    return render(renderPageElement(route, path))
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
                projectId: '123',
                status: 'DRAFT',
            },
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: {
                id: '123',
                members: [{
                    role: 'manager',
                    userId: 12345,
                }],
                name: 'Allowed Project',
                status: 'active',
            },
        })
        mockedCheckProjectAccess.mockReturnValue(true)
        mockedUseFetchResourceRoles.mockReturnValue({
            isLoading: false,
            resourceRoles: [],
        })
        mockedUseFetchResources.mockReturnValue({
            isLoading: false,
            resources: [],
        })
        mockedIsChallengeCompletedOrCancelled.mockImplementation((status?: string) => (
            status === 'COMPLETED' || status?.startsWith('CANCELLED')
        ))
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

        const editorForm = screen.getByTestId('challenge-editor-form')
        const rightHeader = screen.getByTestId('right-header')
        const headerCancelButton = within(rightHeader)
            .getByRole('button', { name: 'Cancel' })
        const footerCancelButton = within(editorForm)
            .getByRole('button', { name: 'Cancel' })

        expect(editorForm.getAttribute('data-edit-mode'))
            .toBe('true')
        expect(headerCancelButton)
            .toBeTruthy()
        expect(footerCancelButton)
            .toBeTruthy()

        const titleAction = screen.getByTestId('title-action')
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
            headerCancelButton
                .getAttribute('data-secondary'),
        )
            .toBe('true')
        expect(
            footerCancelButton
                .getAttribute('data-size'),
        )
            .toBe('lg')
    })

    it('opens cancellation options from the edit footer and applies the selected status', async () => {
        const user = userEvent.setup()
        const mutate = jest.fn()
            .mockResolvedValue(undefined)
        mockedPatchChallenge.mockResolvedValue({})
        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                discussions: [],
                id: '456',
                name: 'Edit test',
                prizeSets: [],
                projectId: '123',
                status: 'DRAFT',
            },
            error: undefined,
            isLoading: false,
            mutate,
        })

        renderPage(
            '/projects/123/challenges/456/edit',
            '/projects/:projectId/challenges/:challengeId/edit',
        )

        const editorForm = await screen.findByTestId('challenge-editor-form')
        await user.click(within(editorForm)
            .getByRole('button', { name: 'Cancel' }))

        const cancelStatusOption = screen.getByRole('button', {
            name: 'Cancelled Failed Review',
        })
        expect(cancelStatusOption)
            .toBeTruthy()
        expect(cancelStatusOption.parentElement?.className)
            .toContain('cancelMenuStart')
        expect(screen.getByText('Challenge Editor Form'))
            .toBeTruthy()

        await user.click(cancelStatusOption)

        expect(screen.getByText('Cancel Challenge'))
            .toBeTruthy()
        expect(screen.getByText(
            'Do you want to cancel challenge Edit test with status Cancelled Failed Review?',
        ))
            .toBeTruthy()

        await user.click(screen.getByRole('button', { name: 'Confirm' }))

        await waitFor(() => {
            expect(mockedPatchChallenge)
                .toHaveBeenCalledWith('456', {
                    status: 'CANCELLED_FAILED_REVIEW',
                })
        })
        expect(mutate)
            .toHaveBeenCalled()
    })

    it('renders a read-only draft challenge view with header and footer actions', async () => {
        renderPage(
            '/projects/123/challenges/456/view',
            '/projects/:projectId/challenges/:challengeId/view',
        )

        await waitFor(() => {
            expect(screen.getByText('Challenge View Form'))
                .toBeTruthy()
        })

        expect(
            screen.getByTestId('challenge-editor-form')
                .getAttribute('data-edit-mode'),
        )
            .toBe('false')
        expect(screen.getByRole('heading', { name: 'View Edit test' }))
            .toBeTruthy()
        const headerActions = within(screen.getByTestId('right-header'))
        const footerActions = within(screen.getByRole('group', {
            name: 'Challenge footer actions',
        }))

        expect(headerActions.getByRole('button', { name: 'Cancel' }))
            .toBeTruthy()
        expect(headerActions.getByRole('button', { name: 'Launch' }))
            .toBeTruthy()
        expect(headerActions.getByRole('button', { name: 'Edit' }))
            .toBeTruthy()
        expect(footerActions.getByRole('button', { name: 'Cancel' }))
            .toBeTruthy()
        expect(footerActions.getByRole('button', { name: 'Launch' }))
            .toBeTruthy()
        expect(footerActions.getByRole('button', { name: 'Edit' }))
            .toBeTruthy()
        expect(
            footerActions.getByRole('button', { name: 'Edit' })
                .getAttribute('data-secondary'),
        )
            .toBe('true')
        expect(
            footerActions.getByRole('button', { name: 'Edit' })
                .getAttribute('data-size'),
        )
            .toBe('lg')
        expect(footerActions.queryByRole('link'))
            .toBeNull()
    })

    it('disables launch when challenge budget is not approved', async () => {
        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                approvalStatus: 'PENDING_APPROVAL',
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

        renderPage(
            '/projects/123/challenges/456/view',
            '/projects/:projectId/challenges/:challengeId/view',
        )

        await waitFor(() => {
            expect(screen.getByText('Challenge View Form'))
                .toBeTruthy()
        })

        expect(screen.getAllByRole('button', { name: 'Launch' }))
            .toHaveLength(2)
        expect(screen.getAllByRole('button', { name: 'Launch' })
            .every(button => (button as HTMLButtonElement).disabled))
            .toBe(true)
    })

    it('keeps launch enabled for a fun challenge without budget approval', async () => {
        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                approvalStatus: 'PENDING_APPROVAL',
                discussions: [{
                    url: 'https://example.com/forum/challenges/456',
                }],
                funChallenge: true,
                id: '456',
                name: 'Fun challenge',
                prizeSets: [],
                status: 'DRAFT',
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

        expect(screen.getAllByRole('button', { name: 'Launch' }))
            .toHaveLength(2)
        expect(screen.getAllByRole('button', { name: 'Launch' })
            .every(button => !(button as HTMLButtonElement).disabled))
            .toBe(true)
    })

    it('keeps launch enabled when challenge budget is approved', async () => {
        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                approvalStatus: 'APPROVED',
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

        renderPage(
            '/projects/123/challenges/456/view',
            '/projects/:projectId/challenges/:challengeId/view',
        )

        await waitFor(() => {
            expect(screen.getByText('Challenge View Form'))
                .toBeTruthy()
        })

        expect(screen.getAllByRole('button', { name: 'Launch' }))
            .toHaveLength(2)
        expect(screen.getAllByRole('button', { name: 'Launch' })
            .every(button => !(button as HTMLButtonElement).disabled))
            .toBe(true)
    })

    it('enables launch immediately after approving the budget from the form', async () => {
        const user = userEvent.setup()

        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                approvalStatus: 'PENDING_APPROVAL',
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

        renderPage(
            '/projects/123/challenges/456/view',
            '/projects/:projectId/challenges/:challengeId/view',
        )

        await waitFor(() => {
            expect(screen.getByText('Challenge View Form'))
                .toBeTruthy()
        })

        expect(screen.getAllByRole('button', { name: 'Launch' })
            .every(button => (button as HTMLButtonElement).disabled))
            .toBe(true)

        await user.click(screen.getByRole('button', { name: 'Mock approve budget' }))

        expect(screen.getAllByRole('button', { name: 'Launch' })
            .every(button => !(button as HTMLButtonElement).disabled))
            .toBe(true)
    })

    it('allows project-scoped challenge views when the user has challenge resource read access', async () => {
        mockedCheckProjectAccess.mockReturnValue(false)
        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                discussions: [],
                id: '456',
                metadata: [{
                    name: 'is_test_challenge',
                    value: 'true',
                }],
                name: 'Read-only test challenge',
                prizeSets: [],
                projectId: '123',
                status: 'COMPLETED',
            },
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: {
                id: '123',
                members: [{
                    userId: 99999,
                }],
                name: 'Restricted Project',
                status: 'active',
            },
        })
        mockedUseFetchResourceRoles.mockReturnValue({
            isLoading: false,
            resourceRoles: [{
                fullReadAccess: true,
                fullWriteAccess: false,
                id: 'problem-tester-role',
                isActive: true,
                name: 'Problem Tester',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            isLoading: false,
            resources: [{
                challengeId: '456',
                memberId: '12345',
                roleId: 'problem-tester-role',
            }],
        })

        renderPage(
            '/projects/123/challenges/456/view',
            '/projects/:projectId/challenges/:challengeId/view',
        )

        await waitFor(() => {
            expect(screen.getByText('Challenge View Form'))
                .toBeTruthy()
        })

        expect(mockedUseFetchChallenge)
            .toHaveBeenCalledWith('456')
        expect(screen.queryByText('You don’t have access to this project. Please contact support@topcoder.com.'))
            .toBeNull()
        expect(screen.queryByRole('button', { name: 'Edit' }))
            .toBeNull()
        expect(screen.queryByRole('button', { name: 'Delete' }))
            .toBeNull()
    })

    it(
        'shows edit action for project-scoped challenge views when the challenge resource grants write access',
        async () => {
            mockedCheckProjectAccess.mockReturnValue(false)
            mockedUseFetchProject.mockReturnValue({
                error: undefined,
                isLoading: false,
                project: {
                    id: '123',
                    members: [{
                        userId: 99999,
                    }],
                    name: 'Restricted Project',
                    status: 'active',
                },
            })
            mockedUseFetchResourceRoles.mockReturnValue({
                isLoading: false,
                resourceRoles: [{
                    fullReadAccess: true,
                    fullWriteAccess: true,
                    id: 'problem-writer-role',
                    isActive: true,
                    name: 'Problem Writer',
                }],
            })
            mockedUseFetchResources.mockReturnValue({
                isLoading: false,
                resources: [{
                    challengeId: '456',
                    memberId: '12345',
                    roleId: 'problem-writer-role',
                }],
            })

            renderPage(
                '/projects/123/challenges/456/view',
                '/projects/:projectId/challenges/:challengeId/view',
            )

            await waitFor(() => {
                expect(screen.getByText('Challenge View Form'))
                    .toBeTruthy()
            })

            expect(screen.getAllByRole('button', { name: 'Edit' }))
                .toHaveLength(2)
        },
    )

    it('blocks project-scoped challenge views when project and challenge resource access are denied', async () => {
        mockedCheckProjectAccess.mockReturnValue(false)
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: {
                id: '123',
                members: [{
                    userId: 99999,
                }],
                name: 'Restricted Project',
                status: 'active',
            },
        })

        renderPage(
            '/projects/123/challenges/456/view',
            '/projects/:projectId/challenges/:challengeId/view',
        )

        await waitFor(() => {
            expect(screen.getByText('You don’t have access to this project. Please contact support@topcoder.com.'))
                .toBeTruthy()
        })

        expect(mockedUseFetchChallenge)
            .toHaveBeenCalledWith('456')
        expect(screen.queryByText('Challenge View Form'))
            .toBeNull()
        expect(screen.queryByRole('heading', { name: 'View Edit test' }))
            .toBeNull()
        expect(screen.queryByRole('button', { name: 'Edit' }))
            .toBeNull()
    })

    it('blocks unscoped challenge views after resolving the challenge project', async () => {
        mockedCheckProjectAccess.mockReturnValue(false)
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: {
                id: '123',
                members: [{
                    userId: 99999,
                }],
                name: 'Restricted Project',
                status: 'active',
            },
        })

        renderPage(
            '/challenges/456/view',
            '/challenges/:challengeId/view',
        )

        await waitFor(() => {
            expect(screen.getByText('You don’t have access to this project. Please contact support@topcoder.com.'))
                .toBeTruthy()
        })

        expect(mockedUseFetchChallenge)
            .toHaveBeenCalledWith('456')
        expect(mockedUseFetchProject)
            .toHaveBeenCalledWith('123')
        expect(screen.queryByText('Challenge View Form'))
            .toBeNull()
        expect(screen.queryByRole('heading', { name: 'View Edit test' }))
            .toBeNull()
    })

    it('treats trailing-slash view routes as read-only mode', async () => {
        renderPage(
            '/projects/123/challenges/456/view/',
            '/projects/:projectId/challenges/:challengeId/view/*',
        )

        await waitFor(() => {
            expect(screen.getByText('Challenge View Form'))
                .toBeTruthy()
        })

        expect(
            screen.getByTestId('challenge-editor-form')
                .getAttribute('data-edit-mode'),
        )
            .toBe('false')
        expect(screen.getAllByRole('button', { name: 'Edit' }))
            .toHaveLength(2)
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
        expect(screen.getAllByRole('button', { name: 'Edit' }))
            .toHaveLength(2)
    })

    it('shows mark complete in read-only view mode for active task challenges', async () => {
        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                discussions: [{
                    url: 'https://example.com/forum/challenges/456',
                }],
                id: '456',
                name: 'Active task challenge',
                prizeSets: [],
                status: 'ACTIVE',
                task: {
                    isTask: true,
                },
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
            '/projects/123/challenges/456/view',
            '/projects/:projectId/challenges/:challengeId/view',
        )

        await waitFor(() => {
            expect(screen.getByText('Challenge View Form'))
                .toBeTruthy()
        })

        expect(mockedShouldShowCompleteTaskAction)
            .toHaveBeenCalledWith(
                true,
                'details',
                expect.objectContaining({
                    id: '456',
                    status: 'ACTIVE',
                    task: {
                        isTask: true,
                    },
                }),
            )
        expect(screen.getAllByRole('button', { name: 'Mark Complete' }))
            .toHaveLength(2)
        expect(screen.getAllByRole('button', { name: 'Edit' }))
            .toHaveLength(2)
    })

    it('hides the read-only edit action for completed challenges', async () => {
        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                discussions: [{
                    url: 'https://example.com/forum/challenges/456',
                }],
                id: '456',
                metadata: [{
                    name: 'is_test_challenge',
                    value: 'false',
                }],
                name: 'Completed challenge',
                prizeSets: [],
                status: 'COMPLETED',
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

        await waitFor(() => {
            expect(screen.queryByRole('button', { name: 'Edit' }))
                .toBeNull()
            expect(screen.queryByRole('button', { name: 'Delete' }))
                .toBeNull()
        })
    })

    it('hides the read-only edit action for cancelled challenges', async () => {
        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                discussions: [{
                    url: 'https://example.com/forum/challenges/456',
                }],
                id: '456',
                name: 'Cancelled challenge',
                prizeSets: [],
                status: 'CANCELLED_CLIENT_REQUEST',
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

        await waitFor(() => {
            expect(screen.queryByRole('button', { name: 'Edit' }))
                .toBeNull()
            expect(screen.queryByRole('button', { name: 'Delete' }))
                .toBeNull()
        })
    })

    it.each([
        'COMPLETED',
        'CANCELLED_CLIENT_REQUEST',
    ])('allows an authorized user to delete a persisted test challenge in %s status', async status => {
        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                discussions: [],
                id: '456',
                metadata: [{
                    name: 'is_test_challenge',
                    value: 'true',
                }],
                name: 'Disposable production test',
                prizeSets: [],
                projectId: '123',
                status,
            },
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })

        renderPage(
            '/projects/123/challenges/456/view',
            '/projects/:projectId/challenges/:challengeId/view',
        )

        const rightHeader = within(screen.getByTestId('right-header'))

        await waitFor(() => {
            expect(rightHeader.getByRole('button', { name: 'Delete' }))
                .toBeTruthy()
        })
        expect(screen.getAllByRole('button', { name: 'Delete' }))
            .toHaveLength(2)

        fireEvent.click(rightHeader.getByRole('button', { name: 'Delete' }))
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

        await waitFor(() => {
            expect(mockedDeleteChallenge)
                .toHaveBeenCalledWith('456')
        })
    })

    it.each([
        'DRAFT',
        'APPROVED',
        'ACTIVE',
    ])('hides delete for a persisted test challenge in non-terminal %s status', async status => {
        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                discussions: [],
                id: '456',
                metadata: [{
                    name: 'is_test_challenge',
                    value: 'true',
                }],
                name: 'In-progress production test',
                prizeSets: [],
                projectId: '123',
                status,
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
        expect(screen.queryByRole('button', { name: 'Delete' }))
            .toBeNull()
    })

    it.each([
        true,
        'TRUE',
        false,
        'false',
    ])('hides terminal test-challenge delete for non-exact metadata value %p', async value => {
        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                discussions: [],
                id: '456',
                metadata: [{
                    name: 'is_test_challenge',
                    value,
                }],
                name: 'Invalid metadata production test',
                prizeSets: [],
                projectId: '123',
                status: 'COMPLETED',
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
        expect(screen.queryByRole('button', { name: 'Delete' }))
            .toBeNull()
    })

    it('hides terminal test-challenge delete from an observer project member', async () => {
        mockedUseFetchChallenge.mockReturnValue({
            challenge: {
                discussions: [],
                id: '456',
                metadata: [{
                    name: 'is_test_challenge',
                    value: 'true',
                }],
                name: 'Observer-only production test',
                prizeSets: [],
                projectId: '123',
                status: 'COMPLETED',
            },
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
        })
        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            project: {
                id: '123',
                members: [{
                    role: 'observer',
                    userId: 12345,
                }],
                name: 'Read-only Project',
                status: 'active',
            },
        })

        renderPage(
            '/projects/123/challenges/456/view',
            '/projects/:projectId/challenges/:challengeId/view',
        )

        await waitFor(() => {
            expect(screen.getByText('Challenge View Form'))
                .toBeTruthy()
        })
        expect(screen.queryByRole('button', { name: 'Edit' }))
            .toBeNull()
        expect(screen.queryByRole('button', { name: 'Delete' }))
            .toBeNull()
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

        const rightHeader = within(screen.getByTestId('right-header'))
        const editorForm = within(screen.getByTestId('challenge-editor-form'))

        await waitFor(() => {
            expect(rightHeader.getByRole('button', { name: 'Cancel' }))
                .toBeTruthy()
            expect(editorForm.getByRole('button', { name: 'Cancel' }))
                .toBeTruthy()
        })

        expect(
            rightHeader.getByRole('button', { name: 'Cancel' })
                .getAttribute('data-secondary'),
        )
            .toBe('true')
        expect(
            editorForm.getByRole('button', { name: 'Cancel' })
                .getAttribute('data-size'),
        )
            .toBe('lg')
        expect(
            rightHeader.getByRole('button', { name: 'Mark Complete' })
                .getAttribute('data-secondary'),
        )
            .toBe('true')
        expect(
            rightHeader.getByRole('button', { name: 'Mark Complete' })
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

    it('hides the delete action when a created challenge advances to DRAFT', async () => {
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
            expect(screen.getByRole('button', { name: 'Delete' }))
                .toBeTruthy()
        })

        fireEvent.click(screen.getByRole('button', { name: 'Mock save as draft' }))

        await waitFor(() => {
            expect(within(screen.getByTestId('title-action'))
                .getByText('DRAFT'))
                .toBeTruthy()
            expect(screen.queryByRole('button', { name: 'Delete' }))
                .toBeNull()
        })
    })

    it('clears stale header state after a fresh challenge fetch 403', async () => {
        const mutate = jest.fn()
        let challengeResult: UseFetchChallengeResult = {
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
            isError: false,
            isLoading: false,
            mutate,
        }
        mockedUseFetchChallenge.mockImplementation(() => challengeResult)

        const route = '/projects/123/challenges/456/edit'
        const path = '/projects/:projectId/challenges/:challengeId/edit'
        const renderResult = renderPage(route, path)

        await waitFor(() => {
            expect(screen.getByText('Challenge Editor Form'))
                .toBeTruthy()
        })

        expect(within(screen.getByTestId('title-action'))
            .getByText('DRAFT'))
            .toBeTruthy()
        expect(within(screen.getByTestId('right-header'))
            .getByRole('link', { name: 'Challenge' }))
            .toBeTruthy()
        expect(within(screen.getByTestId('right-header'))
            .getByRole('button', { name: 'Launch' }))
            .toBeTruthy()

        challengeResult = {
            challenge: undefined,
            error: Object.assign(new Error('Forbidden'), { status: 403 }),
            isError: true,
            isLoading: false,
            mutate,
        }
        renderResult.rerender(renderPageElement(route, path))

        await waitFor(() => {
            expect(screen.getByText('Forbidden'))
                .toBeTruthy()
        })
        expect(within(screen.getByTestId('title-action'))
            .queryByText('DRAFT'))
            .toBeNull()
        expect(within(screen.getByTestId('right-header'))
            .queryByRole('link', { name: 'Challenge' }))
            .toBeNull()
        expect(within(screen.getByTestId('right-header'))
            .queryByRole('button', { name: 'Launch' }))
            .toBeNull()
        expect(within(screen.getByTestId('right-header'))
            .queryByRole('button', { name: 'Cancel' }))
            .toBeNull()
    })
})
