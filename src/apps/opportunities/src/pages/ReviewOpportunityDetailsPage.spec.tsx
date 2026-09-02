/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import '@testing-library/jest-dom'
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'

import { ReviewOpportunity } from '../models'
import { applyToReviewOpportunity } from '../services'

import { ReviewOpportunityDetailsPage } from './ReviewOpportunityDetailsPage'

const mockUseSWR = jest.fn()
const mockedApplyToReviewOpportunity = applyToReviewOpportunity as jest.Mock
let mockProfile: { roles: string[]; userId: number } | undefined

jest.mock('swr', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWR(...args),
}))

jest.mock('react-toastify', () => ({
    toast: { error: jest.fn(), success: jest.fn() },
}))

jest.mock('~/libs/core', () => ({
    authUrlLogin: (url: string): string => url,
    useProfileContext: () => ({ profile: mockProfile }),
}), { virtual: true })

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        TOPCODER_URL: 'https://www.topcoder.example',
        URLS: { USER_PROFILE: 'https://profiles.topcoder-dev.com' },
    },
}), { virtual: true })

jest.mock('~/libs/cms', () => ({
    getSafeCmsLink: (value?: string): string | undefined => value,
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        DefaultMemberIcon: Icon,
        IconOutline: new Proxy({}, { get: () => Icon }),
        LoadingSpinner: (): JSX.Element => <span>Loading</span>,
    }
}, { virtual: true })

jest.mock('../components', () => ({
    ChallengeMarkdown: (props: { markdown: string }): JSX.Element => <article>{props.markdown}</article>,
    ReportIssueModal: (): JSX.Element => <></>,
}))

jest.mock('../services', () => ({
    applyToReviewOpportunity: jest.fn(),
    getReviewOpportunity: jest.fn(),
}))

/**
 * Returns a Review API detail fixture for both Figma compensation variants.
 *
 * @param overrides Review fields replaced for the current test.
 * @returns complete detail fixture suitable for rendering the route.
 * @throws Does not throw.
 */
function reviewFixture(overrides: Partial<ReviewOpportunity> = {}): ReviewOpportunity {
    return {
        applicationCount: 2,
        applicationRoles: ['REVIEWER'],
        applications: [
            {
                applicationDate: '2026-06-12T09:35:00',
                handle: 'DaraK',
                id: 'application-1',
                role: 'REVIEWER',
                status: 'PENDING',
            },
            {
                applicationDate: '2026-06-10T12:27:00',
                handle: 'fajar.mln',
                id: 'application-2',
                role: 'REVIEWER',
                status: 'APPROVED',
            },
            { handle: 'cancelled-member', id: 'cancelled', status: 'CANCELLED' },
        ],
        canApply: true,
        challengeData: {
            createdAt: '2026-06-19T00:00:00',
            skills: ['TypeScript'],
            tags: ['Featured'],
            technologies: ['React.js', { name: 'TypeScript' }],
            track: 'Development',
            type: 'Challenge',
        },
        challengeId: 'challenge-id',
        challengeName: 'Admin Challenge Curation UI Prototype',
        duration: 172800,
        id: 'review-id',
        incrementalPayment: 10,
        openPositions: 2,
        payments: [{ payment: 20, role: 'REVIEWER', roleId: 1 }],
        reviewRequirements: 'Challenge Summary',
        startDate: '2026-06-22T00:00:00',
        ...overrides,
    }
}

/**
 * Renders the detail route with the current SWR fixture.
 *
 * @returns nothing; assertions use the testing-library document.
 * @throws Does not throw.
 */
function renderPage(): void {
    render(
        <MemoryRouter initialEntries={['/opportunities/review/review-id']}>
            <Routes>
                <Route path='/opportunities/review/:reviewOpportunityId' element={<ReviewOpportunityDetailsPage />} />
            </Routes>
        </MemoryRouter>,
    )
}

describe('ReviewOpportunityDetailsPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedApplyToReviewOpportunity.mockResolvedValue({})
        mockProfile = { roles: ['Topcoder User'], userId: 12345 }
        mockUseSWR.mockReturnValue({
            data: reviewFixture(),
            error: undefined,
            isValidating: false,
            mutate: jest.fn(),
        })
    })

    it('renders Figma review requirements, split compensation, and the three-column applications table', () => {
        renderPage()

        expect(screen.getByRole('heading', { name: 'Admin Challenge Curation UI Prototype' }))
            .toBeInTheDocument()
        expect(screen.getByText('Featured'))
            .toBeInTheDocument()
        expect(screen.getByText('React.js'))
            .toBeInTheDocument()
        expect(screen.getAllByText('TypeScript'))
            .toHaveLength(1)
        expect(screen.getByText('$20'))
            .toBeInTheDocument()
        expect(screen.getByText('$10'))
            .toBeInTheDocument()
        expect(screen.getByText('$20').parentElement?.parentElement)
            .toHaveTextContent('Base payment')
        expect(screen.getByText(/19 June, 2026/))
            .toBeInTheDocument()
        expect(screen.getByText('How to become a reviewer?'))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: /learn more/i }))
            .toHaveAttribute(
                'href',
                'https://www.topcoder.example/thrive/articles/Reviewer%20Qualification%20Requirements',
            )
        expect(screen.getByRole('link', { name: /learn more/i }))
            .toHaveAttribute('target', '_blank')
        expect(screen.getByRole('link', { name: /learn more/i }))
            .toHaveAttribute('rel', 'noreferrer')
        expect(screen.getByRole('button', { name: 'Apply to be a reviewer' }))
            .toBeDisabled()
        expect(screen.getByText(/Please read the challenge specification carefully/))
            .toBeInTheDocument()

        fireEvent.click(screen.getByRole('tab', { name: /Applications/ }))

        expect(screen.getByRole('columnheader', { name: 'Handle' }))
            .toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Role' }))
            .toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Application Date' }))
            .toBeInTheDocument()
        expect(screen.queryByRole('columnheader', { name: 'Completed reviews' }))
            .not.toBeInTheDocument()
        expect(screen.getByText('12 June, 2026, 9:35'))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'DaraK' }))
            .toHaveAttribute('href', expect.stringMatching(/\/DaraK$/))
        expect(screen.queryByText('cancelled-member'))
            .not.toBeInTheDocument()
        expect(screen.getByText('1 - 2 of 2 items'))
            .toBeInTheDocument()
    })

    it('uses the centered per-submission compensation and applies for an eligible reviewer', async () => {
        const mutate = jest.fn()
        mockProfile = { roles: ['Reviewer'], userId: 12345 }
        mockUseSWR.mockReturnValue({
            data: reviewFixture({
                incrementalPayment: 0,
                payments: [{ payment: 0.23, role: 'REVIEWER', roleId: 1 }],
            }),
            error: undefined,
            isValidating: false,
            mutate,
        })

        renderPage()

        expect(screen.getByText('$0.23'))
            .toBeInTheDocument()
        expect(screen.getByText('$0.23').parentElement)
            .toHaveTextContent('Paid persuccessfully reviewed submission')
        expect(screen.queryByText('How to become a reviewer?'))
            .not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Apply to be a reviewer' }))
        await waitFor(() => {
            expect(mockedApplyToReviewOpportunity)
                .toHaveBeenCalledWith('review-id', 'REVIEWER')
            expect(mutate)
                .toHaveBeenCalled()
        })
    })

    it('labels the review start truthfully when the API has no posted timestamp', () => {
        mockUseSWR.mockReturnValue({
            data: reviewFixture({
                challengeData: {
                    technologies: ['React.js'],
                    track: 'Development',
                    type: 'Challenge',
                },
            }),
            error: undefined,
            isValidating: false,
            mutate: jest.fn(),
        })

        renderPage()

        expect(screen.getByText('Starts:'))
            .toBeInTheDocument()
        expect(screen.queryByText('Posted:'))
            .not.toBeInTheDocument()
    })
})
