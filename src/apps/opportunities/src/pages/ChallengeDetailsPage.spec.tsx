/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'

import { ChallengeDetailsPage } from './ChallengeDetailsPage'

const mockUseSWR = jest.fn()

jest.mock('swr', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWR(...args),
}))

jest.mock('react-toastify', () => ({
    toast: { error: jest.fn(), success: jest.fn() },
}))

jest.mock('~/libs/core', () => ({
    authUrlLogin: (url: string): string => url,
    useProfileContext: () => ({ profile: undefined }),
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        IconOutline: new Proxy({}, { get: () => Icon }),
        LoadingSpinner: (): JSX.Element => <span>Loading</span>,
    }
}, { virtual: true })

jest.mock('../components', () => ({
    ChallengeDescription: (): JSX.Element => <div>Requirements</div>,
    ChallengeDetailHeader: (): JSX.Element => <header>Challenge header</header>,
    ChallengeSidebar: (): JSX.Element => <aside />,
    ChallengeTermsModal: (): JSX.Element => <></>,
    extractTableOfContents: (): [] => [],
    isHtmlDescriptionFormat: (): boolean => false,
    MarathonDashboard: (): JSX.Element => <div />,
    OpportunityPagination: (): JSX.Element => <div>Pagination</div>,
    ReportIssueModal: (): JSX.Element => <></>,
    SubmissionHistoryModal: (): JSX.Element => <></>,
}))

jest.mock('../components/challenge-card.utils', () => ({
    challengeCatalogKey: (): string => '',
    challengePlacementPrizes: (): [] => [],
}))

jest.mock('../services', () => ({
    agreeToChallengeTerms: jest.fn(),
    getChallengeOpportunity: jest.fn(),
    getChallengeProjectResults: jest.fn(),
    getChallengeRegistration: jest.fn(),
    getChallengeReviewSummations: jest.fn(),
    getChallengeSubmissionPreviews: jest.fn(),
    getChallengeSubmissions: jest.fn(),
    getChallengeSubmitters: jest.fn(),
    registerForChallenge: jest.fn(),
    unregisterFromChallenge: jest.fn(),
}))

jest.mock('../utils', () => ({
    attachMarathonReviewSummations: (submissions: unknown[]): unknown[] => submissions,
    challengeForumUrl: (): undefined => undefined,
    formatMarathonScore: (): string => '—',
    isMarathonMatchChallenge: (): boolean => false,
    marathonDashboardIsEnabled: (): boolean => false,
    marathonSubmissionScores: (): Record<string, never> => ({}),
    memberProfileUrl: (handle: string): string => `https://profiles.topcoder-dev.com/${handle}`,
    shouldShowFinalSubmissionScores: (): boolean => false,
}))

describe('ChallengeDetailsPage registrants', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseSWR.mockImplementation((key: unknown) => {
            if (Array.isArray(key) && key[0] === 'opportunities:registrants') {
                return {
                    data: {
                        items: [{
                            created: '2026-08-14T09:35:00.000Z',
                            id: 'resource-1',
                            memberHandle: 'tourist',
                            rating: 3765,
                        }],
                        page: 1,
                        perPage: 10,
                        total: 1,
                        totalPages: 1,
                    },
                    error: undefined,
                    isValidating: false,
                    mutate: jest.fn(),
                }
            }

            if (typeof key === 'string' && key.startsWith('opportunities:challenge:')) {
                return {
                    data: {
                        description: 'Challenge requirements',
                        id: 'challenge-id',
                        name: 'Challenge',
                        numOfRegistrants: 1,
                        track: 'Development',
                        type: 'Challenge',
                    },
                    error: undefined,
                    isValidating: false,
                    mutate: jest.fn(),
                }
            }

            return {
                data: undefined,
                error: undefined,
                isValidating: false,
                mutate: jest.fn(),
            }
        })
    })

    it('renders the Figma handle, rating, and registration-date columns', () => {
        render(
            <MemoryRouter initialEntries={['/opportunities/challenge/challenge-id']}>
                <Routes>
                    <Route path='/opportunities/challenge/:challengeId' element={<ChallengeDetailsPage />} />
                </Routes>
            </MemoryRouter>,
        )

        fireEvent.click(screen.getByRole('tab', { name: /Registrants/ }))

        expect(screen.getByRole('columnheader', { name: 'Handle' }))
            .toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Rating' }))
            .toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: 'Registration Date' }))
            .toBeInTheDocument()
        expect(screen.getByRole('cell', { name: '3765' }))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'tourist' }))
            .toHaveAttribute('href', 'https://profiles.topcoder-dev.com/tourist')
    })
})
