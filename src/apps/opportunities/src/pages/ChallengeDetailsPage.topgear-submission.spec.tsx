/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SWRConfig } from 'swr'

import { ChallengeOpportunity } from '../models'
import {
    createChallengeSubmission,
    createChallengeUrlSubmission,
    getChallengeOpportunity,
    getChallengeRegistration,
    getChallengeSubmissions,
} from '../services'

import { ChallengeDetailsPage } from './ChallengeDetailsPage'

let mockSubdomain = 'www'

jest.mock('~/config', () => ({
    AppSubdomain: { topgear: 'topgear' },
    EnvironmentConfig: {
        REVIEW_APP_URL: 'https://review.topcoder-dev.com',
        get SUBDOMAIN(): string { return mockSubdomain },
        TOPGEAR: { GROUP_ID: 'topgear-group' },
        TOPGEAR_ALLOWED_SUBMISSIONS_DOMAINS: ['wipro365.sharepoint.com'],
        URLS: {
            TERMS_OF_USE: 'https://www.topcoder-dev.com/terms',
            TOPGEAR_TERMS: 'https://topgear.topcoder-dev.com/challenges/terms/detail/topgear-terms',
        },
    },
}), { virtual: true })
jest.mock('~/libs/core', () => ({
    recordAnalyticsEvent: jest.fn(),
    useProfileContext: () => ({ initialized: true, profile: { handle: 'coder', userId: 123 } }),
}), { virtual: true })
jest.mock('~/libs/cms', () => ({}), { virtual: true })
jest.mock('~/libs/ui', () => {
    /** Renders a placeholder icon without loading the shared UI library; never throws. */
    const Icon = (): JSX.Element => <svg />
    return {
        ConfirmModal: (): JSX.Element => <></>,
        IconOutline: new Proxy({}, { get: () => Icon }),
        LoadingSpinner: (): JSX.Element => <span>Loading</span>,
    }
}, { virtual: true })
jest.mock('react-toastify', () => ({
    toast: { error: jest.fn(), success: jest.fn() },
}))
jest.mock('../components', () => ({
    ChallengeDescription: (): JSX.Element => <div>Requirements</div>,
    ChallengeDetailHeader: jest.requireActual('../components/ChallengeDetailHeader').ChallengeDetailHeader,
    ChallengeSidebar: (): JSX.Element => <aside />,
    ChallengeSubmissionUpload: jest.requireActual('../components/ChallengeSubmissionUpload').ChallengeSubmissionUpload,
    ChallengeTermsModal: (): JSX.Element => <></>,
    extractTableOfContents: (): [] => [],
    isHtmlDescriptionFormat: (): boolean => false,
    OpportunityTabLoading: (): JSX.Element => <span>Loading submissions</span>,
    ReportIssueModal: (): JSX.Element => <></>,
}))
jest.mock('../services', () => ({
    createChallengeSubmission: jest.fn(),
    createChallengeUrlSubmission: jest.fn(),
    getChallengeAiReviewConfig: jest.fn(),
    getChallengeForumTopics: jest.fn(),
    getChallengeMemberResource: jest.fn(),
    getChallengeOpportunity: jest.fn(),
    getChallengeRegistration: jest.fn(),
    getChallengeSubmissions: jest.fn(),
}))

const mockGetChallenge = getChallengeOpportunity as jest.MockedFunction<typeof getChallengeOpportunity>
const mockGetRegistration = getChallengeRegistration as jest.MockedFunction<typeof getChallengeRegistration>
const mockGetSubmissions = getChallengeSubmissions as jest.MockedFunction<typeof getChallengeSubmissions>
const mockCreateUrlSubmission = createChallengeUrlSubmission as jest.MockedFunction<typeof createChallengeUrlSubmission>

describe('Topgear submissions from the My Submissions deep link', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(window, 'scrollTo')
            .mockImplementation(() => undefined)
        mockCreateUrlSubmission.mockResolvedValue({ id: 'url-submission-id' })
        mockGetRegistration.mockResolvedValue({ id: 'registration-id', memberId: '123' })
        mockGetSubmissions.mockResolvedValue({ items: [], page: 1, perPage: 10, total: 0, totalPages: 0 })
    })

    afterEach(() => jest.restoreAllMocks())

    it.each([
        { groups: [], metadata: undefined, subdomain: 'topgear' },
        { groups: ['topgear-group'], metadata: undefined, subdomain: 'www' },
        { groups: [], metadata: [{ name: 'submission_type', value: 'zip' }], subdomain: 'topgear' },
        { groups: ['topgear-group'], metadata: [{ name: 'submission_type', value: 'zip' }], subdomain: 'www' },
    ])('submits a URL for a Topgear challenge: %j', async ({ groups, metadata, subdomain }: {
        groups: string[]
        metadata: ChallengeOpportunity['metadata']
        subdomain: string
    }) => {
        mockSubdomain = subdomain
        mockGetChallenge.mockResolvedValue({
            currentPhaseNames: ['Submission'],
            groups,
            id: 'challenge-id',
            metadata,
            name: 'Topgear challenge',
            phases: [{ isOpen: true, name: 'Submission' }],
            status: 'ACTIVE',
            track: 'Development',
            type: 'Challenge',
        })

        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <MemoryRouter initialEntries={['/opportunities/challenge/challenge-id?tab=mine']}>
                    <Routes>
                        <Route element={<ChallengeDetailsPage />} path='/opportunities/challenge/:challengeId' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )

        await screen.findByText('You have no submissions yet')
        expect(screen.getByRole('tab', { name: /^My Submissions/ }))
            .toHaveAttribute('aria-selected', 'true')
        fireEvent.click(within(screen.getByRole('tabpanel'))
            .getByRole('button', { name: 'Submit a solution' }))

        const urlInput = await screen.findByLabelText(/Submission URL/)
        expect(screen.queryByLabelText(/Upload File/)).not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'TopGear terms and conditions' }))
            .toHaveAttribute('href', 'https://topgear.topcoder-dev.com/challenges/terms/detail/topgear-terms')
        fireEvent.change(urlInput, { target: { value: 'https://wipro365.sharepoint.com/sites/project/deliverable' } })
        fireEvent.click(screen.getByRole('button', { name: 'Set URL' }))
        fireEvent.click(screen.getByRole('checkbox', { name: 'I understand and agree' }))
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

        await waitFor(() => expect(createChallengeUrlSubmission)
            .toHaveBeenCalledWith(
                'challenge-id',
                '123',
                'CONTEST_SUBMISSION',
                'https://wipro365.sharepoint.com/sites/project/deliverable',
                expect.any(AbortSignal),
            ))
        expect(createChallengeSubmission).not.toHaveBeenCalled()
        expect(await screen.findByText('url-submission-id'))
            .toBeInTheDocument()
    })
})
