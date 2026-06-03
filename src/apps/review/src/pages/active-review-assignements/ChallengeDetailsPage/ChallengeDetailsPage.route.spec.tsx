/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { PropsWithChildren, ReactNode } from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import {
    useFetchAiReviewConfig,
    useFetchAiReviewDecisions,
    useFetchAiWorkflowsRuns,
    useFetchChallengeInfo,
    useFetchChallengeResources,
    useFetchChallengeSubmissions,
    useFetchScreeningReview,
    useFetchSubmissionInfo,
    useRole,
} from '../../../lib/hooks'
import { ReviewAppContext } from '../../../lib/contexts/ReviewAppContext'
import { ChallengeDetailContextProvider } from '../../../lib/contexts/ChallengeDetailContextProvider'
import { ReviewsContextProvider } from '../../reviews/ReviewsContext'
import { ReviewsViewer } from '../../reviews/ReviewsViewer'

import { ChallengeDetailsPage } from './ChallengeDetailsPage'

jest.mock('~/config', () => ({
    AppSubdomain: {
        review: 'review',
    },
    EnvironmentConfig: {
        REVIEW: {
            CHALLENGE_PAGE_URL: 'https://community.example.com/challenges',
        },
        SUBDOMAIN: 'review',
    },
}), { virtual: true })

jest.mock('~/apps/admin/src/lib', () => ({
    TableLoading: () => <div>Loading</div>,
}), { virtual: true })

jest.mock('~/apps/admin/src/lib/utils', () => ({
    handleError: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn()
        .mockReturnValue('#000000'),
    UserRole: {
        administrator: 'administrator',
        projectManager: 'projectManager',
    },
    xhrGetAsync: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: PropsWithChildren<{ open?: boolean }>) => (
        props.open ? <div>{props.children}</div> : undefined
    ),
    Button: (props: PropsWithChildren<{
        label?: string
        onClick?: () => void
    }>) => (
        <button onClick={props.onClick} type='button'>
            {props.children ?? props.label}
        </button>
    ),
    InputCheckbox: () => <input aria-label='Phase Notifications' type='checkbox' />,
    InputDatePicker: () => <input aria-label='Date' />,
    InputText: () => <input aria-label='Text' />,
}), { virtual: true })

jest.mock('../../../lib', () => {
    const challengeDetailContext = jest.requireActual('../../../lib/contexts/ChallengeDetailContext')
    const reviewAppContext = jest.requireActual('../../../lib/contexts/ReviewAppContext')

    return {
        ...challengeDetailContext,
        ...reviewAppContext,
        ChallengeDetailsContent: () => <div>Challenge details content</div>,
        ChallengeLinks: () => <div>Challenge links</div>,
        ChallengePhaseInfo: () => <div>Challenge phase info</div>,
        ChallengeScopedErrorState: (props: {
            message?: string
            onRetry: () => void
        }) => (
            <div role='alert'>
                <span>
                    {props.message ?? 'Something went wrong while loading the challenge. Please try again.'}
                </span>
                <button onClick={props.onRetry} type='button'>Retry</button>
            </div>
        ),
        ChallengeTimeline: () => <div>Challenge timeline</div>,
        PageWrapper: (props: PropsWithChildren<{
            breadCrumb?: Array<{ label?: string; path?: string }>
            pageTitle?: string
            rightHeader?: ReactNode
            titleUrl?: string
        }>) => (
            <div>
                <h1>{props.pageTitle}</h1>
                <div data-testid='title-url'>{props.titleUrl}</div>
                <div data-testid='breadcrumbs'>
                    {(props.breadCrumb ?? [])
                        .map(item => `${item.label ?? ''}:${item.path ?? ''}`)
                        .join('|')}
                </div>
                <div data-testid='right-header'>{props.rightHeader}</div>
                {props.children}
            </div>
        ),
        TableNoRecord: (props: { message?: string }) => <div>{props.message}</div>,
        TableRegistration: () => <div>Resources table</div>,
        Tabs: () => <div>Tabs</div>,
    }
})

jest.mock('../../../lib/hooks', () => ({
    useFetchAiReviewConfig: jest.fn(),
    useFetchAiReviewDecisions: jest.fn(),
    useFetchAiWorkflowsRuns: jest.fn(),
    useFetchChallengeInfo: jest.fn(),
    useFetchChallengeResources: jest.fn(),
    useFetchChallengeSubmissions: jest.fn(),
    useFetchScreeningReview: jest.fn(),
    useFetchSubmissionInfo: jest.fn(),
    useRole: jest.fn(),
}))

jest.mock('../../../lib/services', () => ({
    updateChallengePhase: jest.fn(),
    updatePhaseChangeNotifications: jest.fn(),
}))

jest.mock('../../reviews/components/ReviewsSidebar', () => ({
    ReviewsSidebar: () => <div>Reviews sidebar</div>,
}))

jest.mock('../../reviews/components/AiReviewViewer', () => ({
    AiReviewViewer: () => <div>AI review viewer</div>,
}))

jest.mock('../../reviews/components/ReviewViewer', () => ({
    ReviewViewer: () => <div>Review viewer</div>,
}))

jest.mock('../../../lib/components/SubmissionBarInfo', () => ({
    SubmissionBarInfo: () => <div>Submission bar</div>,
}))

const mockedUseFetchAiReviewConfig = useFetchAiReviewConfig as jest.Mock
const mockedUseFetchAiReviewDecisions = useFetchAiReviewDecisions as jest.Mock
const mockedUseFetchAiWorkflowsRuns = useFetchAiWorkflowsRuns as jest.Mock
const mockedUseFetchChallengeInfo = useFetchChallengeInfo as jest.Mock
const mockedUseFetchChallengeResources = useFetchChallengeResources as jest.Mock
const mockedUseFetchChallengeSubmissions = useFetchChallengeSubmissions as jest.Mock
const mockedUseFetchScreeningReview = useFetchScreeningReview as jest.Mock
const mockedUseFetchSubmissionInfo = useFetchSubmissionInfo as jest.Mock
const mockedUseRole = useRole as jest.Mock

const retryChallengeInfo = jest.fn()
const retryChallengeResources = jest.fn()
const retryChallengeSubmissions = jest.fn()

const challengeInfo = {
    currentPhase: 'Registration',
    currentPhaseEndDate: '2026-01-01T00:00:00.000Z',
    id: 'challenge-1',
    name: 'Visible Challenge',
    phases: [],
    status: 'ACTIVE',
    submissions: [],
    track: {
        id: 'track-1',
        name: 'Development',
    },
    type: {
        id: 'type-1',
        name: 'Code',
    },
    typeId: 'type-1',
}

/**
 * Creates the 403 error shape returned by the mocked challenge-scoped fetches.
 *
 * @returns an Error object with a 403 status field.
 */
function makeForbiddenError(): Error {
    return Object.assign(new Error('Forbidden'), { status: 403 })
}

/**
 * Renders a review-app route with the review app context provider.
 *
 * @param route concrete route used as the initial memory history entry.
 * @param element route element under test.
 * @param path route pattern registered in the memory router.
 */
function renderWithReviewContext(route: string, element: JSX.Element, path: string): void {
    render(
        <ReviewAppContext.Provider value={{
            cancelLoadChallengeRelativeInfos: jest.fn(),
            challengeRelativeInfosMapping: {},
            loadChallengeRelativeInfos: jest.fn(),
            loginUserInfo: {
                roles: [],
                userId: 1001,
            },
            resourceRoleMapping: {},
            resourceRoleReviewer: undefined,
            resourceRoleSubmitter: undefined,
        }}
        >
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path={path} element={element} />
                </Routes>
            </MemoryRouter>
        </ReviewAppContext.Provider>,
    )
}

/**
 * Renders the direct challenge details route through ChallengeDetailContextProvider.
 */
function renderChallengeDetailsRoute(): void {
    renderWithReviewContext(
        '/active-challenges/challenge-1/challenge-details',
        <ChallengeDetailContextProvider>
            <ChallengeDetailsPage />
        </ChallengeDetailContextProvider>,
        '/active-challenges/:challengeId/challenge-details',
    )
}

/**
 * Renders the nested reviews route through both challenge and reviews providers.
 */
function renderReviewsRoute(): void {
    renderWithReviewContext(
        '/active-challenges/challenge-1/challenge-details/reviews/submission-1',
        <ChallengeDetailContextProvider>
            <ReviewsContextProvider>
                <ReviewsViewer />
            </ReviewsContextProvider>
        </ChallengeDetailContextProvider>,
        '/active-challenges/:challengeId/challenge-details/reviews/:submissionId',
    )
}

describe('review challenge direct route errors', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        retryChallengeInfo.mockClear()
        retryChallengeResources.mockClear()
        retryChallengeSubmissions.mockClear()
        retryChallengeInfo.mockImplementation(() => Promise.resolve(undefined))
        retryChallengeResources.mockImplementation(() => Promise.resolve(undefined))
        retryChallengeSubmissions.mockImplementation(() => Promise.resolve(undefined))

        mockedUseFetchChallengeInfo.mockReturnValue({
            challengeInfo,
            error: undefined,
            isError: false,
            isLoading: false,
            retry: retryChallengeInfo,
        })
        mockedUseFetchChallengeResources.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            myResources: [{
                challengeId: 'challenge-1',
                created: '2026-01-01T00:00:00.000Z',
                createdBy: 'system',
                id: 'resource-1',
                memberHandle: 'reviewer',
                memberId: '1001',
                roleId: 'role-1',
                roleName: 'Reviewer',
            }],
            myRoles: ['Reviewer'],
            registrants: [],
            resourceMemberIdMapping: {},
            resources: [],
            retry: retryChallengeResources,
            reviewers: [],
        })
        mockedUseFetchChallengeSubmissions.mockReturnValue({
            challengeSubmissions: [],
            deletedLegacySubmissionIds: new Set<string>(),
            deletedSubmissionIds: new Set<string>(),
            error: undefined,
            isError: false,
            isLoading: false,
            retry: retryChallengeSubmissions,
        })
        mockedUseFetchAiReviewConfig.mockReturnValue({
            aiReviewConfig: undefined,
            isLoading: false,
        })
        mockedUseFetchAiReviewDecisions.mockReturnValue({
            decisions: [],
            isLoading: false,
        })
        mockedUseFetchScreeningReview.mockReturnValue({
            approvalMinimumPassingScore: 0,
            approvalReviews: [],
            checkpoint: [],
            checkpointReview: [],
            checkpointReviewMinimumPassingScore: 0,
            checkpointScreeningMinimumPassingScore: 0,
            isLoading: false,
            isLoadingReviews: false,
            mappingReviewAppeal: {},
            postMortemMinimumPassingScore: 0,
            postMortemReviews: [],
            review: [],
            reviewMinimumPassingScore: 0,
            reviewProgress: 0,
            screening: [],
            screeningMinimumPassingScore: 0,
            submitterReviews: [],
        })
        mockedUseRole.mockReturnValue({
            actionChallengeRole: 'Reviewer',
        })
        mockedUseFetchSubmissionInfo.mockReturnValue([undefined, false])
        mockedUseFetchAiWorkflowsRuns.mockReturnValue({
            isLoading: false,
            runs: [],
        })
    })

    it('renders a generic retryable error for a direct challenge-info 403', async () => {
        mockedUseFetchChallengeInfo.mockReturnValue({
            challengeInfo: undefined,
            error: makeForbiddenError(),
            isError: true,
            isLoading: false,
            retry: retryChallengeInfo,
        })

        renderChallengeDetailsRoute()

        await waitFor(() => {
            expect(screen.getByRole('alert').textContent)
                .toContain('Something went wrong while loading the challenge. Please try again.')
        })

        fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

        expect(retryChallengeInfo)
            .toHaveBeenCalled()
        expect(screen.queryByText(/permission to see this challenge/i))
            .toBeNull()
    })

    it('renders a generic retryable error for a direct resources 403 instead of permission denied', async () => {
        mockedUseFetchChallengeResources.mockReturnValue({
            error: makeForbiddenError(),
            isError: true,
            isLoading: false,
            myResources: [],
            myRoles: [],
            registrants: [],
            resourceMemberIdMapping: {},
            resources: [],
            retry: retryChallengeResources,
            reviewers: [],
        })

        renderChallengeDetailsRoute()

        await waitFor(() => {
            expect(screen.getByRole('alert').textContent)
                .toContain('Something went wrong while loading the challenge. Please try again.')
        })

        expect(screen.queryByText(/permission to see this challenge/i))
            .toBeNull()
    })

    it('renders the shared generic error on the nested reviews route without undefined challenge links', async () => {
        mockedUseFetchChallengeInfo.mockReturnValue({
            challengeInfo: undefined,
            error: makeForbiddenError(),
            isError: true,
            isLoading: false,
            retry: retryChallengeInfo,
        })

        renderReviewsRoute()

        await waitFor(() => {
            expect(screen.getByRole('alert').textContent)
                .toContain('Something went wrong while loading the challenge. Please try again.')
        })

        expect(screen.queryByText('Review viewer'))
            .toBeNull()
        expect(screen.getByTestId('title-url').textContent)
            .toBe('')
        expect(screen.getByTestId('breadcrumbs').textContent)
            .not.toContain('undefined')
    })
})
