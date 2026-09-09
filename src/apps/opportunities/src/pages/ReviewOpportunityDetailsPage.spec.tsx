/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import '@testing-library/jest-dom'
import { readFileSync } from 'fs'
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'
import { toast } from 'react-toastify'

import { ReviewOpportunity } from '../models'
import { applyToReviewOpportunity } from '../services'

import { ReviewOpportunityDetailsPage } from './ReviewOpportunityDetailsPage'

const mockUseSWR = jest.fn()
const mockedApplyToReviewOpportunity = applyToReviewOpportunity as jest.Mock
const mockedToastSuccess = toast.success as jest.Mock
let mockProfile: { roles: string[]; userId: number } | undefined
const reviewDetailStyles = readFileSync(`${__dirname}/ReviewOpportunityDetailsPage.module.scss`, 'utf8')

jest.mock('swr', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWR(...args),
}))

jest.mock('react-toastify', () => ({
    toast: { error: jest.fn(), success: jest.fn() },
}))

jest.mock('~/libs/core', () => ({
    authUrlLogin: (url: string): string => url,
    getRatingColor: (rating?: number): string => {
        if (rating === undefined) return '#2a2a2a'
        return rating >= 2200 ? '#EF3A3A' : '#616BD5'
    },
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
    getMemberProfilesByUserIds: jest.fn(),
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
                userId: '101',
            },
            {
                applicationDate: '2026-06-10T12:27:00',
                handle: 'fajar.mln',
                id: 'application-2',
                role: 'REVIEWER',
                status: 'APPROVED',
                userId: '102',
            },
            { handle: 'cancelled-member', id: 'cancelled', status: 'CANCELLED' },
        ],
        canApply: true,
        challengeData: {
            skills: ['TypeScript'],
            tags: ['Featured'],
            technologies: ['React.js', { name: 'TypeScript' }],
            track: 'Development',
            type: 'Challenge',
        },
        challengeId: 'challenge-id',
        challengeName: 'Admin Challenge Curation UI Prototype',
        createdAt: '2026-06-19T00:00:00',
        duration: 172800,
        id: 'review-id',
        incrementalPayment: 0.55,
        openPositions: 2,
        payments: [{ payment: 1.43, role: 'REVIEWER', roleId: 1 }],
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
        jest.restoreAllMocks()
        jest.clearAllMocks()
        jest.spyOn(window, 'scrollTo')
            .mockImplementation(() => undefined)
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
        expect(screen.getByText('$1.98'))
            .toBeInTheDocument()
        expect(screen.getByText('$0.55'))
            .toBeInTheDocument()
        expect(screen.getByText('$1.98').parentElement?.parentElement)
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
        expect(screen.getByRole('link', { name: /Review Process and Rules/ }))
            .toHaveAttribute(
                'href',
                'https://www.topcoder.example/thrive/articles/Topcoder%20Review%20Process',
            )
        expect(screen.getByRole('link', { name: /Topcoder Challenges Explained/ }))
            .toHaveAttribute(
                'href',
                [
                    'https://www.topcoder.example/thrive/articles/',
                    'all-about-topcoder-challenges-tasks-and-gig-work-opportunities',
                ].join(''),
            )
        expect(screen.getByRole('link', { name: /Review Process and Rules/ }))
            .toHaveAttribute('target', '_blank')
        expect(screen.getByRole('heading', { name: 'Thrive Articles' })
            .querySelector('img'))
            .toBeInTheDocument()
        expect(screen.getByText('Posted:')
            .closest('span')?.parentElement?.querySelector('img'))
            .toBeInTheDocument()
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

    it('sorts applications in both directions from the application-date header', () => {
        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: /Applications/ }))

        const header = screen.getByRole('columnheader', { name: 'Application Date' })
        expect(header)
            .toHaveAttribute('aria-sort', 'descending')
        expect(within(screen.getAllByRole('row')[1])
            .getByText('DaraK'))
            .toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Application Date' }))

        expect(header)
            .toHaveAttribute('aria-sort', 'ascending')
        expect(within(screen.getAllByRole('row')[1])
            .getByText('fajar.mln'))
            .toBeInTheDocument()
    })

    it('renders all application fields as labeled mobile records', () => {
        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: /Applications/ }))

        expect(screen.getByRole('button', { name: 'Sort by Application Date' }))
            .toBeInTheDocument()
        expect(screen.getAllByRole('cell')
            .map(cell => cell.getAttribute('data-mobile-label')))
            .toEqual([
                'Handle',
                'Role',
                'Application Date',
                'Handle',
                'Role',
                'Application Date',
            ])
        expect(screen.getByRole('table').className)
            .toContain('applicationTable')
        expect(reviewDetailStyles)
            .toContain('.applicationTable {')
        expect(reviewDetailStyles)
            .toMatch(/\.tableScroll \.applicationTable\s*\{[\s\S]*?min-width: 0;[\s\S]*?width: 100%;/)
        expect(reviewDetailStyles)
            .toMatch(/\.tableScroll \.applicationTable\s*\{[\s\S]*?thead\s*\{[\s\S]*?button\s*\{\s*display: none;/)
        expect(reviewDetailStyles)
            .toMatch(/\.member\s*\{[\s\S]*?min-width: 0;[\s\S]*?overflow: hidden;[\s\S]*?width: 100%;/)
    })

    it('uses member ratings to color application handles', () => {
        const opportunityResponse = {
            data: reviewFixture(),
            error: undefined,
            isValidating: false,
            mutate: jest.fn(),
        }
        mockUseSWR.mockImplementation((key: unknown) => (
            Array.isArray(key) && key[0] === 'opportunities:review-applicant-profiles'
                ? {
                    data: [
                        { handle: 'DaraK', maxRating: 1450, userId: '101' },
                        { handle: 'fajar.mln', maxRating: 2300, userId: '102' },
                    ],
                    error: undefined,
                    isValidating: false,
                }
                : opportunityResponse
        ))

        renderPage()
        fireEvent.click(screen.getByRole('tab', { name: /Applications/ }))

        expect(screen.getByRole('link', { name: 'DaraK' })
            .querySelector('strong'))
            .toHaveStyle({ color: '#616BD5' })
        expect(screen.getByRole('link', { name: 'fajar.mln' })
            .querySelector('strong'))
            .toHaveStyle({ color: '#EF3A3A' })
    })

    it('resets the viewport when a review details route opens', () => {
        renderPage()

        expect(window.scrollTo)
            .toHaveBeenCalledWith({ left: 0, top: 0 })
    })

    it('keeps the clipped header decoration behind, not inside, compensation', () => {
        renderPage()

        const decoration = screen.getByTestId('review-header-decoration')
        const compensation = screen.getByText('Compensation')
            .closest('aside')
        expect(compensation)
            .not.toContainElement(decoration)
        expect(decoration.parentElement?.tagName)
            .toBe('HEADER')
        expect(reviewDetailStyles)
            .toContain('bottom: -200px;')
        expect(reviewDetailStyles)
            .toContain('right: -168px;')
        expect(reviewDetailStyles)
            .toContain('top: auto;')
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

    it('keeps a full opportunity open and confirms reviewer waitlist placement', async () => {
        const mutate = jest.fn()
        mockProfile = { roles: ['Reviewer'], userId: 12345 }
        mockUseSWR.mockReturnValue({
            data: reviewFixture({
                approvedApplicationCount: 2,
                canApply: true,
                openPositions: 2,
                remainingPositions: 0,
            }),
            error: undefined,
            isValidating: false,
            mutate,
        })

        renderPage()

        expect(screen.getByText(/All reviewer positions are currently filled/))
            .toBeInTheDocument()
        const waitlistButton = screen.getByRole('button', { name: 'Apply to be a reviewer (waitlist)' })
        expect(waitlistButton)
            .toBeEnabled()
        fireEvent.click(waitlistButton)

        await waitFor(() => {
            expect(mockedApplyToReviewOpportunity)
                .toHaveBeenCalledWith('review-id', 'REVIEWER')
            expect(mutate)
                .toHaveBeenCalled()
            expect(mockedToastSuccess)
                .toHaveBeenCalledWith(
                    'You are waitlisted. Support may contact you if another reviewer cannot complete the review and '
                    + 'you are needed.',
                )
        })
    })

    it('accepts a waitlist application from the legacy capacity-only eligibility response', async () => {
        const mutate = jest.fn()
        mockProfile = { roles: ['Reviewer'], userId: 12345 }
        mockUseSWR.mockReturnValue({
            data: reviewFixture({
                approvedApplicationCount: 2,
                canApply: false,
                canApplyReason: 'NO_OPEN_POSITIONS',
                openPositions: 2,
                remainingPositions: 0,
            }),
            error: undefined,
            isValidating: false,
            mutate,
        })

        renderPage()

        const waitlistButton = screen.getByRole('button', {
            name: 'Apply to be a reviewer (waitlist)',
        })
        expect(waitlistButton)
            .toBeEnabled()
        fireEvent.click(waitlistButton)

        await waitFor(() => {
            expect(mockedApplyToReviewOpportunity)
                .toHaveBeenCalledWith('review-id', 'REVIEWER')
            expect(mutate)
                .toHaveBeenCalled()
        })
    })

    it('shows the caller waitlisted state after a full-opportunity application', () => {
        mockProfile = { roles: ['Reviewer'], userId: 12345 }
        mockUseSWR.mockReturnValue({
            data: reviewFixture({
                canApply: false,
                canApplyReason: 'ALREADY_APPLIED',
                myApplications: [{ status: 'PENDING' }],
                remainingPositions: 0,
            }),
            error: undefined,
            isValidating: false,
            mutate: jest.fn(),
        })

        renderPage()

        expect(screen.getByRole('button', { name: 'Waitlisted' }))
            .toBeDisabled()
    })

    it('labels the review start truthfully when the API has no posted timestamp', () => {
        mockUseSWR.mockReturnValue({
            data: reviewFixture({
                challengeData: {
                    technologies: ['React.js'],
                    track: 'Development',
                    type: 'Challenge',
                },
                createdAt: undefined,
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
