/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { PropsWithChildren } from 'react'
import '@testing-library/jest-dom'
import {
    fireEvent,
    render,
    screen,
    within,
    waitFor,
} from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'

import { ChallengeDetailsPage } from './ChallengeDetailsPage'

const mockUseSWR = jest.fn()
const mockDeleteSubmission = jest.fn()
const mockUnregister = jest.fn()
let mockProfile: { handle: string; roles?: string[]; userId: number } | undefined
let mockRegistration: { id: string } | undefined
let mockChallenge: Record<string, unknown>
let mockMemberProfiles: Record<string, unknown>[]
let mockProjectResults: Record<string, unknown>[]
let mockPreviewSubmissions: Record<string, unknown>[]
let mockRegistrants: Record<string, unknown>[]
let mockReviewSummations: Record<string, unknown>[]
let mockSubmissions: Record<string, unknown>[]
let mockWinnerStats: Record<string, unknown>[]

jest.mock('../assets/medal-1.svg', () => 'medal-1')
jest.mock('../assets/medal-2.svg', () => 'medal-2')
jest.mock('../assets/medal-3.svg', () => 'medal-3')
jest.mock('./ChallengeDetailsPage.module.scss', () => new Proxy({}, {
    get: (_target, property: string): string => property,
}))

jest.mock('swr', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWR(...args),
}))

jest.mock('react-toastify', () => ({
    toast: { error: jest.fn(), success: jest.fn() },
}))

jest.mock('~/libs/core', () => ({
    authUrlLogin: (url: string): string => url,
    getMemberStatsAsync: jest.fn(),
    recordAnalyticsEvent: jest.fn(),
    useProfileContext: () => ({ profile: mockProfile }),
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        ConfirmModal: (props: PropsWithChildren<{
            action?: string
            onClose?: () => void
            onConfirm: () => void
            open: boolean
            title: string
        }>): JSX.Element => (
            props.open ? (
                <div aria-label={props.title} role='dialog'>
                    <div>{props.children}</div>
                    <button onClick={props.onClose} type='button'>Cancel</button>
                    <button onClick={props.onConfirm} type='button'>{props.action || 'Confirm'}</button>
                </div>
            ) : <></>
        ),
        IconOutline: new Proxy({}, { get: () => Icon }),
        LoadingSpinner: (): JSX.Element => <span>Loading</span>,
    }
}, { virtual: true })

jest.mock('../components', () => ({
    ChallengeDescription: (): JSX.Element => <div>Requirements content</div>,
    ChallengeDetailHeader: (props: {
        isRegistered: boolean
        onSubmit: () => void
        onUnregister: () => Promise<void>
    }): JSX.Element => (
        <header>
            Challenge header
            {props.isRegistered && (
                <>
                    <button onClick={props.onUnregister} type='button'>Unregister</button>
                    <button onClick={props.onSubmit} type='button'>Submit a solution</button>
                </>
            )}
        </header>
    ),
    ChallengeForum: (props: { canCreateAnnouncements?: boolean }): JSX.Element => (
        <div>{props.canCreateAnnouncements ? 'Administrator forum content' : 'Forum content'}</div>
    ),
    ChallengeSidebar: (): JSX.Element => <aside />,
    ChallengeSubmissionUpload: (props: { onBack: () => void }): JSX.Element => (
        <div>
            Submission upload form
            <button onClick={props.onBack} type='button'>Back to submissions</button>
        </div>
    ),
    ChallengeTermsModal: (): JSX.Element => <></>,
    extractTableOfContents: (): [] => [],
    isHtmlDescriptionFormat: (): boolean => false,
    MarathonDashboard: (): JSX.Element => <div>Challenge Activity</div>,
    OpportunityPagination: (): JSX.Element => <div>Pagination</div>,
    ReportIssueModal: (): JSX.Element => <></>,
    SubmissionHistoryModal: (props: {
        open: boolean
        submission?: { id: string }
    }): JSX.Element => (
        <div>{props.open ? `History modal ${props.submission?.id}` : ''}</div>
    ),
}))

jest.mock('../components/challenge-card.utils', () => ({
    challengeCatalogKey: (track?: string): string => (track ?? '')
        .toLowerCase()
        .replace(/[^a-z]/g, ''),
    challengePlacementPrizes: (challenge: {
        prizeSets?: Array<{ prizes?: Array<{ type?: string; value?: number }> }>
    }): Array<{ placement: number; type?: string; value?: number }> => (
        challenge.prizeSets?.[0]?.prizes?.map((prize, index) => ({
            ...prize,
            placement: index + 1,
        })) ?? []
    ),
}))

jest.mock('../services', () => ({
    agreeToChallengeTerms: jest.fn(),
    deleteChallengeSubmission: (...args: unknown[]) => mockDeleteSubmission(...args),
    getChallengeAiReviewConfig: jest.fn(),
    getChallengeOpportunity: jest.fn(),
    getChallengeProjectResults: jest.fn(),
    getChallengeRegistration: jest.fn(),
    getChallengeReviewSummations: jest.fn(),
    getChallengeSubmissionDownloadUrl: jest.fn(),
    getChallengeSubmissionPreviews: jest.fn(),
    getChallengeSubmissions: jest.fn(),
    getChallengeSubmitters: jest.fn(),
    getMemberProfilesByUserIds: jest.fn(),
    registerForChallenge: jest.fn(),
    unregisterFromChallenge: (...args: unknown[]) => mockUnregister(...args),
}))

jest.mock('../utils', () => ({
    attachMarathonReviewSummations: (
        submissions: Array<Record<string, unknown>>,
        summations: Array<Record<string, unknown>>,
    ): Array<Record<string, unknown>> => submissions.map(submission => ({
        ...submission,
        reviewSummation: [
            ...((submission.reviewSummation as Array<Record<string, unknown>> | undefined) ?? []),
            ...summations.filter(summation => summation.submissionId === submission.id),
        ],
    })),
    challengeTrackLabel: (track?: string): string => track ?? 'challenge',
    challengeTrackWins: (stats?: {
        DEVELOP?: { wins?: number }
        wins?: number
    }): number | undefined => stats?.DEVELOP?.wins ?? stats?.wins,
    formatMarathonFinalScore: (score: number | undefined, fallback: string): string => (
        score === undefined ? fallback : String(Math.max(0, score))
    ),
    formatMarathonScore: (score: number | undefined, fallback: string): string => (
        score === undefined ? fallback : String(score)
    ),
    isMarathonMatchChallenge: (challenge: { type?: string }): boolean => challenge.type === 'Marathon Match',
    marathonDashboardIsEnabled: (challenge: {
        metadata?: { name: string; value: unknown }[]
        type?: string
    }): boolean => challenge.type === 'Marathon Match'
        && challenge.metadata?.some(item => item.name === 'show_data_dashboard' && item.value === true) === true,
    marathonSubmissionScores: (submission: {
        finalScore?: number
        provisionalScore?: number
        reviewSummation?: Array<{
            aggregateScore?: number
            isFinal?: boolean
            isProvisional?: boolean
        }>
    }): { finalScore?: number; provisionalScore?: number } => ({
        finalScore: submission.reviewSummation?.find(item => item.isFinal)?.aggregateScore
            ?? submission.finalScore,
        provisionalScore: submission.reviewSummation?.find(item => item.isProvisional)?.aggregateScore
            ?? submission.provisionalScore,
    }),
    marathonSubmissionTestProgress: (): {
        process: string
        progress: number
        status: string
    } => ({ process: 'System', progress: 50, status: 'In progress' }),
    memberProfileUrl: (handle: string): string => `https://profiles.topcoder-dev.com/${handle}`,
    shouldShowFinalSubmissionScores: (
        challenge: {
            phases?: Array<{ isOpen?: boolean; name: string; scheduledStartDate?: string }>
            status?: string
            type?: string
        },
        submissions: Array<{
            finalScore?: number
            reviewSummation?: Array<{ aggregateScore?: number; isFinal?: boolean }>
        }>,
        additionalScores: unknown[] = [],
    ): boolean => {
        if (challenge.type !== 'Marathon Match') return challenge.status === 'COMPLETED'
        if (challenge.phases?.some(phase => [
            'Submission',
            'Checkpoint Submission',
            'Topgear Submission',
        ].includes(phase.name) && phase.isOpen)) return false
        return challenge.phases?.some(phase => phase.name === 'Review'
            && !phase.isOpen
            && !!phase.scheduledStartDate) === true
            || submissions.some(submission => submission.finalScore !== undefined
                || submission.reviewSummation?.some(summation => (
                    summation.isFinal && summation.aggregateScore !== undefined
                )))
            || additionalScores.some(score => Number.isFinite(Number(score)))
    },
    winnerFinalScore: (
        winner: { placement?: number; userId?: string },
        projectResults: Array<{ finalScore?: number; placement?: number; userId?: string }>,
    ): number | undefined => projectResults.find(result => (
        result.userId === winner.userId && result.placement === winner.placement
    ))?.finalScore,
}))

function swrResponse(data: unknown): Record<string, unknown> {
    return {
        data,
        error: undefined,
        isValidating: false,
        mutate: jest.fn()
            .mockResolvedValue(data),
    }
}

function renderPage(): void {
    render(
        <MemoryRouter initialEntries={['/opportunities/challenge/challenge-id']}>
            <Routes>
                <Route path='/opportunities/challenge/:challengeId' element={<ChallengeDetailsPage />} />
            </Routes>
        </MemoryRouter>,
    )
}

function submissionPage(items: Record<string, unknown>[]): Record<string, unknown> {
    return {
        items,
        page: 1,
        perPage: 10,
        total: items.length,
        totalPages: 1,
    }
}

describe('ChallengeDetailsPage member flows', () => {
    beforeEach(() => {
        jest.restoreAllMocks()
        jest.clearAllMocks()
        mockProfile = undefined
        mockRegistration = undefined
        mockMemberProfiles = []
        mockProjectResults = []
        mockPreviewSubmissions = []
        mockRegistrants = []
        mockReviewSummations = []
        mockSubmissions = []
        mockWinnerStats = []
        mockChallenge = {
            description: 'Challenge requirements',
            id: 'challenge-id',
            name: 'Challenge',
            numOfPosts: 3,
            numOfRegistrants: 8,
            numOfSubmissions: 5,
            track: 'Development',
            type: 'Challenge',
        }
        mockUnregister.mockResolvedValue(undefined)
        mockDeleteSubmission.mockResolvedValue(undefined)
        mockUseSWR.mockImplementation((key: unknown) => {
            if (typeof key === 'string' && key.startsWith('opportunities:challenge:')) {
                return swrResponse(mockChallenge)
            }

            if (Array.isArray(key) && key[0] === 'opportunities:registration') {
                return swrResponse(mockRegistration)
            }

            if (Array.isArray(key) && key[0] === 'opportunities:submissions') {
                return swrResponse(submissionPage(mockSubmissions))
            }

            if (Array.isArray(key) && key[0] === 'opportunities:submission-previews') {
                return swrResponse(submissionPage(mockPreviewSubmissions))
            }

            if (Array.isArray(key) && key[0] === 'opportunities:mm-review-summations') {
                return swrResponse(mockReviewSummations)
            }

            if (Array.isArray(key) && key[0] === 'opportunities:registrants') {
                return swrResponse(submissionPage(mockRegistrants))
            }

            if (Array.isArray(key) && key[0] === 'opportunities:member-profiles') {
                return swrResponse(mockMemberProfiles)
            }

            if (Array.isArray(key) && key[0] === 'opportunities:winner-member-profiles') {
                return swrResponse(mockMemberProfiles)
            }

            if (Array.isArray(key) && key[0] === 'opportunities:winner-member-stats') {
                return swrResponse(mockWinnerStats)
            }

            if (Array.isArray(key) && key[0] === 'opportunities:winner-project-results') {
                return swrResponse(mockProjectResults)
            }

            return swrResponse(undefined)
        })
    })

    it('shows only public tabs until the member is registered', () => {
        renderPage()

        expect(screen.getAllByRole('tab')
            .map(tab => tab.textContent))
            .toEqual(['Requirements', 'Registrants8', 'Winners'])
        expect(screen.queryByRole('tab', { name: /^Submissions/ }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('tab', { name: 'Forum' }))
            .not.toBeInTheDocument()
    })

    it('gives an unregistered administrator member tabs without the submission flow', () => {
        mockProfile = { handle: 'admin', roles: ['Administrator'], userId: 123 }
        mockChallenge = {
            ...mockChallenge,
            metadata: [{ name: 'show_data_dashboard', value: true }],
            type: 'Marathon Match',
        }

        renderPage()

        expect(screen.getAllByRole('tab')
            .map(tab => tab.textContent))
            .toEqual([
                'Requirements',
                'Registrants8',
                'Submissions5',
                'Dashboard',
                'Forum3',
                'Winners',
            ])
        expect(screen.queryByRole('tab', { name: 'My Submissions' }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Submit a solution' }))
            .not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('tab', { name: 'Forum 3' }))
        expect(screen.getByText('Administrator forum content'))
            .toBeInTheDocument()
    })

    it('matches community-app by showing all submissions to a signed-in unregistered member', () => {
        mockProfile = { handle: 'viewer', userId: 123 }

        renderPage()

        expect(screen.getByRole('tab', { name: /^Submissions/ }))
            .toBeInTheDocument()
        expect(screen.queryByRole('tab', { name: 'My Submissions' }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('tab', { name: 'Forum' }))
            .not.toBeInTheDocument()
    })

    it('keeps the metadata-gated Design submissions gallery public', () => {
        mockChallenge = {
            ...mockChallenge,
            metadata: [{ name: 'submissionsViewable', value: 'true' }],
            track: 'Design',
        }
        mockPreviewSubmissions = [{
            id: 'released-preview',
            previewUrl: 'https://images.example/released-preview.png',
            submitterHandle: 'designer',
        }]

        renderPage()

        expect(screen.getByRole('tab', { name: /^Submissions/ }))
            .toBeInTheDocument()
        expect(screen.queryByRole('tab', { name: 'My Submissions' }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('tab', { name: 'Forum' }))
            .not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('tab', { name: /^Submissions/ }))
        expect(screen.getByRole('img', { name: 'Submission preview by designer' }))
            .toHaveAttribute('src', 'https://images.example/released-preview.png')
        expect(screen.queryByRole('table'))
            .not.toBeInTheDocument()
    })

    it('uses the Design submission table when private previews are disabled', () => {
        mockChallenge = { ...mockChallenge, track: 'Design' }
        mockSubmissions = [{
            id: 'submission-1',
            submittedDate: '2026-06-03T09:30:00.000Z',
            submitterHandle: 'designer',
        }]

        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: /^Submissions/ }))

        const headers = ['Handle', 'Submission Date', 'Action']
        headers.forEach(header => expect(screen.getByRole('columnheader', { name: header }))
            .toBeInTheDocument())
        expect(screen.queryByRole('columnheader', { name: 'Rating' }))
            .not.toBeInTheDocument()
    })

    it('shows registered tabs and the metadata-gated Marathon Match Dashboard', () => {
        mockProfile = { handle: 'coder', userId: 123 }
        mockRegistration = { id: 'resource-id' }
        mockChallenge = {
            ...mockChallenge,
            metadata: [{ name: 'show_data_dashboard', value: true }],
            type: 'Marathon Match',
        }

        renderPage()

        expect(screen.getAllByRole('tab')
            .map(tab => tab.textContent))
            .toEqual([
                'Requirements',
                'Registrants8',
                'Submissions5',
                'My Submissions',
                'Dashboard',
                'Forum3',
                'Winners',
            ])
    })

    it('opens the in-tab upload workflow from the registered header action', () => {
        mockProfile = { handle: 'coder', userId: 123 }
        mockRegistration = { id: 'resource-id' }

        renderPage()
        fireEvent.click(screen.getByRole('button', { name: 'Submit a solution' }))

        expect(screen.getByRole('tab', { name: 'My Submissions' }))
            .toHaveAttribute('aria-selected', 'true')
        expect(screen.getByText('Submission upload form'))
            .toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Back to submissions' }))
        expect(screen.getByText('You have no submissions yet'))
            .toBeInTheDocument()
    })

    it('resets the selected member tab when unregistering', async () => {
        mockProfile = { handle: 'coder', userId: 123 }
        mockRegistration = { id: 'resource-id' }
        const confirmSpy = jest.spyOn(window, 'confirm')

        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: 'My Submissions' }))
        expect(screen.getByRole('tab', { name: 'My Submissions' }))
            .toHaveAttribute('aria-selected', 'true')

        fireEvent.click(screen.getByRole('button', { name: 'Unregister' }))
        const dialog = screen.getByRole('dialog', { name: 'Unregister from competition?' })
        expect(confirmSpy)
            .not.toHaveBeenCalled()
        fireEvent.click(within(dialog)
            .getByRole('button', { name: 'Unregister' }))

        await waitFor(() => expect(screen.getByRole('tab', { name: 'Requirements' }))
            .toHaveAttribute('aria-selected', 'true'))
        expect(mockUnregister)
            .toHaveBeenCalledWith('challenge-id', 'coder')
    })

    it('opens History in a modal instead of navigating to Review App', () => {
        mockProfile = { handle: 'coder', userId: 123 }
        mockRegistration = { id: 'resource-id' }
        mockSubmissions = [{
            createdAt: '2026-06-03T09:30:00.000Z',
            id: 'submission-1',
            rating: 1450,
            submitterHandle: 'coder',
        }]

        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: /^Submissions/ }))
        fireEvent.click(screen.getByRole('button', { name: 'History' }))

        expect(screen.getByText('History modal submission-1'))
            .toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'History' }))
            .not.toBeInTheDocument()
    })

    it('renders the Development My Submissions fields and authored actions', () => {
        mockProfile = { handle: 'coder', userId: 123 }
        mockRegistration = { id: 'resource-id' }
        mockSubmissions = [{
            createdAt: '2026-06-03T09:30:00.000Z',
            id: 'submission-1',
            status: 'ACTIVE',
            type: 'CONTEST_SUBMISSION',
        }]

        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: 'My Submissions' }))
        const headers = ['Submission ID', 'Type', 'Submission Date', 'Current Status', 'Score', 'Actions']
        headers.forEach(header => expect(screen.getByRole('columnheader', { name: header }))
            .toBeInTheDocument())
        expect(screen.getByText('Contest Submission'))
            .toBeInTheDocument()
        expect(screen.getByText('In Review'))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Open Review App/ }))
            .toHaveAttribute('href', '/review/active-challenges/challenge-id/challenge-details?tab=submission')
        expect(screen.queryByRole('button', { name: 'Download submission submission-1' }))
            .not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'View history for submission submission-1' }))
            .toBeInTheDocument()
    })

    it('renders and deletes the compact Design My Submissions actions', async () => {
        mockProfile = { handle: 'coder', userId: 123 }
        mockRegistration = { id: 'resource-id' }
        mockChallenge = { ...mockChallenge, track: 'Design' }
        mockSubmissions = [{
            createdAt: '2026-06-03T09:30:00.000Z',
            id: 'submission-1',
            type: 'CONTEST_SUBMISSION',
        }]
        jest.spyOn(window, 'confirm')
            .mockReturnValue(true)

        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: 'My Submissions' }))

        const headers = ['Submission ID', 'Type', 'Submission Date', 'Actions']
        headers.forEach(header => expect(screen.getByRole('columnheader', { name: header }))
            .toBeInTheDocument())
        expect(screen.queryByRole('columnheader', { name: 'Current Status' }))
            .not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Download submission submission-1' }))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Open submission submission-1 in Review App' }))
            .toBeInTheDocument()

        const deleteButton = screen.getByRole('button', { name: 'Delete submission submission-1' })
        fireEvent.click(deleteButton)

        await waitFor(() => expect(mockDeleteSubmission)
            .toHaveBeenCalledWith('submission-1'))
        await waitFor(() => expect(deleteButton)
            .not.toBeDisabled())
    })

    it('renders the compact QA My Submissions columns and authored actions', () => {
        mockProfile = { handle: 'coder', userId: 123 }
        mockRegistration = { id: 'resource-id' }
        mockChallenge = {
            ...mockChallenge,
            status: 'COMPLETED',
            track: 'Quality Assurance',
        }
        mockSubmissions = [{
            createdAt: '2026-06-03T09:30:00.000Z',
            id: 'submission-qa',
            type: 'CONTEST_SUBMISSION',
        }]

        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: 'My Submissions' }))

        const headers = ['Submission ID', 'Type', 'Submission Date', 'Actions']
        headers.forEach(header => expect(screen.getByRole('columnheader', { name: header }))
            .toBeInTheDocument())
        expect(screen.queryByRole('columnheader', { name: 'Current Status' }))
            .not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Download submission submission-qa' }))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Open submission submission-qa in Review App' }))
            .toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Delete submission submission-qa' }))
            .not.toBeInTheDocument()
    })

    it('renders Marathon Match testing progress and both score phases', () => {
        mockProfile = { handle: 'coder', userId: 123 }
        mockRegistration = { id: 'resource-id' }
        mockChallenge = { ...mockChallenge, type: 'Marathon Match' }
        mockSubmissions = [{
            createdAt: '2026-06-03T09:30:00.000Z',
            finalScore: 99.5,
            id: 'submission-1',
            provisionalScore: 98.5,
        }]

        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: 'My Submissions' }))
        const headers = [
            'Current Test Process',
            'Test Status',
            'Test Progress',
            'Final Score',
            'Provision Score',
        ]
        headers.forEach(header => expect(screen.getByRole('columnheader', { name: header }))
            .toBeInTheDocument())
        expect(screen.getByText('System'))
            .toBeInTheDocument()
        expect(screen.getByText('In progress'))
            .toBeInTheDocument()
        expect(screen.getByText('50%'))
            .toBeInTheDocument()
        expect(screen.getByText('99.5'))
            .toBeInTheDocument()
        expect(screen.getByText('98.5'))
            .toBeInTheDocument()
    })

    it('populates the released Marathon Match final score from Review Summations', () => {
        mockProfile = { handle: 'coder', userId: 123 }
        mockRegistration = { id: 'resource-id' }
        mockChallenge = {
            ...mockChallenge,
            phases: [{
                isOpen: false,
                name: 'Review',
                scheduledStartDate: '2026-06-04T09:30:00.000Z',
            }],
            type: 'Marathon Match',
        }
        mockSubmissions = [{
            id: 'submission-1',
            provisionalScore: 98.5,
            submitterHandle: 'coder',
        }]
        mockReviewSummations = [{
            aggregateScore: 99.5,
            isFinal: true,
            submissionId: 'submission-1',
        }]

        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: /^Submissions/ }))

        expect(screen.getByRole('cell', { name: '98.5' }))
            .toBeInTheDocument()
        expect(screen.getByRole('cell', { name: '99.5' }))
            .toBeInTheDocument()
    })

    it('matches the Design Registrants columns and the QA submission score columns', () => {
        mockProfile = { handle: 'viewer', userId: 123 }
        mockRegistration = { id: 'resource-id' }
        mockChallenge = { ...mockChallenge, track: 'Design' }
        mockRegistrants = [{
            created: '2026-06-03T09:30:00.000Z',
            id: 'resource-42',
            memberHandle: 'designer',
            memberId: 42,
            rating: 1800,
        }]

        const rendered: ReturnType<typeof render> = render(
            <MemoryRouter initialEntries={['/opportunities/challenge/challenge-id']}>
                <Routes>
                    <Route path='/opportunities/challenge/:challengeId' element={<ChallengeDetailsPage />} />
                </Routes>
            </MemoryRouter>,
        )
        fireEvent.click(screen.getByRole('tab', { name: /^Registrants/ }))
        expect(screen.getByRole('columnheader', { name: 'Handle' }))
            .toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Registration Date' }))
            .toBeInTheDocument()
        expect(screen.queryByRole('columnheader', { name: 'Rating' }))
            .not.toBeInTheDocument()

        rendered.unmount()
        mockChallenge = {
            ...mockChallenge,
            status: 'COMPLETED',
            track: 'Quality Assurance',
        }
        mockSubmissions = [{
            finalScore: 91,
            id: 'submission-qa',
            provisionalScore: 88.5,
            submitterHandle: 'tester',
        }]
        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: /^Submissions/ }))

        const headers = ['Handle', 'Rating', 'Submission Date', 'Initial Score', 'Final Score', 'Action']
        headers.forEach(header => expect(screen.getByRole('columnheader', { name: header }))
            .toBeInTheDocument())
        expect(screen.getByRole('cell', { name: '88.5' }))
            .toBeInTheDocument()
        expect(screen.getByRole('cell', { name: '91' }))
            .toBeInTheDocument()
    })

    it('uses batched member photos and ratings in registrant and submission rows', () => {
        mockProfile = { handle: 'viewer', userId: 123 }
        mockRegistration = { id: 'resource-id' }
        mockMemberProfiles = [{
            handle: 'enriched',
            maxRating: 1800,
            photoURL: 'https://images.example/enriched.png',
            userId: '42',
        }]
        mockRegistrants = [{
            id: 'resource-42',
            memberHandle: 'fallback',
            memberId: 42,
            rating: 900,
        }]
        mockSubmissions = [{
            id: 'submission-42',
            memberId: '42',
            submitterHandle: 'fallback',
            submitterMaxRating: 900,
        }]

        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: /^Registrants/ }))

        expect(screen.getByRole('link', { name: 'enriched' }))
            .toHaveAttribute('href', 'https://profiles.topcoder-dev.com/enriched')
        expect(screen.getByRole('cell', { name: '1800' }))
            .toBeInTheDocument()
        expect(document.querySelector('img[src="https://images.example/enriched.png"]'))
            .toBeInTheDocument()

        fireEvent.click(screen.getByRole('tab', { name: /^Submissions/ }))

        expect(screen.getByRole('cell', { name: '1800' }))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'enriched' }))
            .toBeInTheDocument()
    })

    it('renders every winner in ascending order with profiles, stats, scores, and prizes', () => {
        mockProfile = { handle: 'fourth', userId: 4 }
        mockChallenge = {
            ...mockChallenge,
            prizeSets: [{
                prizes: [
                    { type: 'USD', value: 400 },
                    { type: 'USD', value: 200 },
                    { type: 'USD', value: 100 },
                    { type: 'USD', value: 50 },
                ],
                type: 'PLACEMENT',
            }],
            status: 'COMPLETED',
            winners: [
                { handle: 'second-fallback', placement: 2, userId: '2' },
                { handle: 'first-fallback', placement: 1, userId: '1' },
                { handle: 'fourth-fallback', placement: 4, userId: '4' },
                { handle: 'third-fallback', placement: 3, userId: '3' },
            ],
        }
        mockMemberProfiles = [
            {
                handle: 'first',
                maxRating: 1600,
                photoURL: 'https://images.example/first.png',
                userId: '1',
            },
            { handle: 'second', maxRating: 1500, userId: '2' },
            { handle: 'third', maxRating: 1400, userId: '3' },
            { handle: 'fourth', maxRating: 1300, userId: '4' },
        ]
        mockWinnerStats = [
            { handle: 'first', stats: { DEVELOP: { wins: 7 }, wins: 9 } },
            { handle: 'second', stats: { DEVELOP: { wins: 6 }, wins: 8 } },
            { handle: 'third', stats: { DEVELOP: { wins: 5 }, wins: 7 } },
            { handle: 'fourth', stats: { DEVELOP: { wins: 4 }, wins: 6 } },
        ]
        mockProjectResults = [
            { finalScore: 98.98, placement: 1, userId: '1' },
            { finalScore: 98.88, placement: 2, userId: '2' },
        ]

        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: 'Winners' }))

        const cards = screen.getAllByRole('article')
        expect(cards.map(card => within(card)
            .getByText(/Place$/).textContent))
            .toEqual(['1st Place', '2nd Place', '3rd Place'])
        expect(cards[0])
            .toHaveTextContent('with a final score of 98.98')
        expect(cards[1])
            .toHaveTextContent('with a final score of 98.88')
        expect(cards[0])
            .toHaveTextContent('$400')
        expect(cards[0])
            .toHaveTextContent('7 development wins')
        expect(cards[0])
            .toHaveTextContent('1600 rating')
        expect(within(cards[0])
            .getByRole('link', { name: 'first' }))
            .toHaveAttribute('href', 'https://profiles.topcoder-dev.com/first')
        expect(cards[0].querySelector('img[src="https://images.example/first.png"]'))
            .toBeInTheDocument()

        const remainingWinners = screen.getByRole('table', { name: 'Remaining winners' })
        expect(within(remainingWinners)
            .getByRole('columnheader', { name: 'Development Wins' }))
            .toBeInTheDocument()
        const fourthRow = within(remainingWinners)
            .getByRole('row', { name: /^4th fourth You/ })
        expect(fourthRow)
            .toHaveTextContent('4th')
        expect(fourthRow)
            .toHaveTextContent('$50')
        expect(fourthRow)
            .toHaveTextContent('4')
        expect(within(fourthRow as HTMLElement)
            .getByText('You'))
            .toBeInTheDocument()
    })

    it('omits ratings from the exact three-winner podium state', () => {
        mockChallenge = {
            ...mockChallenge,
            winners: [
                { handle: 'first', placement: 1, userId: '1' },
                { handle: 'second', placement: 2, userId: '2' },
                { handle: 'third', placement: 3, userId: '3' },
            ],
        }
        mockMemberProfiles = [
            { handle: 'first', maxRating: 1600, userId: '1' },
            { handle: 'second', maxRating: 1500, userId: '2' },
            { handle: 'third', maxRating: 1400, userId: '3' },
        ]
        mockWinnerStats = [
            { handle: 'first', stats: { DEVELOP: { wins: 7 } } },
            { handle: 'second', stats: { DEVELOP: { wins: 6 } } },
            { handle: 'third', stats: { DEVELOP: { wins: 5 } } },
        ]

        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: 'Winners' }))

        screen.getAllByRole('article')
            .forEach(card => expect(card)
                .not.toHaveTextContent('rating'))
        expect(screen.queryByRole('table', { name: 'Remaining winners' }))
            .not.toBeInTheDocument()
    })

    it('shows the rating in the exact one-winner podium state', () => {
        mockChallenge = {
            ...mockChallenge,
            winners: [{ handle: 'first', placement: 1, userId: '1' }],
        }
        mockMemberProfiles = [{ handle: 'first', maxRating: 1600, userId: '1' }]
        mockWinnerStats = [{ handle: 'first', stats: { DEVELOP: { wins: 7 } } }]

        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: 'Winners' }))

        expect(screen.getByRole('article'))
            .toHaveTextContent('1600 rating')
    })
})
