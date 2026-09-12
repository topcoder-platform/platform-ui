/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { toast } from 'react-toastify'
import { SWRConfig } from 'swr'

import { ChallengeOpportunity, ChallengeSubmission, ChallengeSubmissionType } from '../models'
import {
    createChallengeSubmission,
    deleteChallengeSubmission,
    getChallengeOpportunity,
    getChallengeRegistration,
    getChallengeSubmissions,
} from '../services'

import { ChallengeDetailsPage } from './ChallengeDetailsPage'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        REVIEW_APP_URL: 'https://review.topcoder-dev.com',
        TOPCODER_URL: 'https://www.topcoder-dev.com',
        URLS: { TERMS_OF_USE: 'https://www.topcoder-dev.com/terms' },
    },
}), { virtual: true })
jest.mock('~/libs/core', () => ({
    recordAnalyticsEvent: jest.fn(),
    useProfileContext: () => ({ profile: { handle: 'coder', userId: 123 } }),
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
    OpportunityPagination: (): JSX.Element => <></>,
    OpportunityTabLoading: (): JSX.Element => <span>Loading submissions</span>,
    ReportIssueModal: (): JSX.Element => <></>,
    SubmissionArtifactsModal: (): JSX.Element => <></>,
    SubmissionHistoryModal: (): JSX.Element => <></>,
}))
jest.mock('../services', () => ({
    createChallengeSubmission: jest.fn(),
    deleteChallengeSubmission: jest.fn(),
    getChallengeAiReviewConfig: jest.fn()
        .mockResolvedValue(undefined),
    getChallengeForumTopics: jest.fn()
        .mockResolvedValue({ topics: [] }),
    getChallengeMemberResource: jest.fn()
        .mockResolvedValue(undefined),
    getChallengeOpportunity: jest.fn(),
    getChallengeRegistration: jest.fn(),
    getChallengeSubmissions: jest.fn(),
}))

const mockCreateSubmission = createChallengeSubmission as jest.MockedFunction<typeof createChallengeSubmission>
const mockDeleteSubmission = deleteChallengeSubmission as jest.MockedFunction<typeof deleteChallengeSubmission>
const mockGetChallenge = getChallengeOpportunity as jest.MockedFunction<typeof getChallengeOpportunity>
const mockGetRegistration = getChallengeRegistration as jest.MockedFunction<typeof getChallengeRegistration>
const mockGetSubmissions = getChallengeSubmissions as jest.MockedFunction<typeof getChallengeSubmissions>
const OTHER_MEMBER_SUBMISSIONS = 2
const LIMIT_ERROR = 'Submission limit reached.'
let challenge: ChallengeOpportunity
let submissions: ChallengeSubmission[]
let submissionLimit: number

/**
 * Renders the real detail page, header, uploader, and SWR cache against stateful service fixtures.
 *
 * @param phase open Design submission phase.
 * @param type Review API submission type for the phase.
 * @param limit configured per-member limit, initially filled by the member.
 * @returns promise settled when the member's existing submissions are visible.
 * @throws Testing Library errors when the initial submission table fails to load.
 */
async function renderSubmissions(
    phase: string = 'Submission',
    type: ChallengeSubmissionType = 'CONTEST_SUBMISSION',
    limit: number = 3,
): Promise<void> {
    submissionLimit = limit
    submissions = Array.from({ length: limit }, (_, index) => ({
        createdAt: '2026-09-01T09:30:00.000Z',
        id: `submission-${index + 1}`,
        memberId: '123',
        type,
    }))
    challenge = {
        currentPhaseNames: ['Registration', phase],
        id: 'challenge-id',
        metadata: [{ name: 'submissionLimit', value: JSON.stringify({ limit, type: 'limited' }) }],
        name: 'Design submission replacement',
        numOfRegistrants: 3,
        numOfSubmissions: limit + OTHER_MEMBER_SUBMISSIONS,
        phases: [
            { isOpen: true, name: 'Registration' },
            { isOpen: true, name: phase },
        ],
        status: 'ACTIVE',
        track: 'Design',
        type: 'Challenge',
    }

    await act(async () => {
        render(
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
                <MemoryRouter initialEntries={['/opportunities/challenge/challenge-id']}>
                    <Routes>
                        <Route element={<ChallengeDetailsPage />} path='/opportunities/challenge/:challengeId' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>,
        )
    })

    const tab = await screen.findByRole('tab', { name: /^My Submissions/ })
    await waitFor(() => expect(tab)
        .toHaveTextContent(`My Submissions${limit}`))
    fireEvent.click(tab)
    await screen.findByRole('button', { name: 'Delete submission submission-1' })
}

/**
 * Opens the real uploader, selects a ZIP, accepts its declaration, and submits it.
 *
 * @returns the selected file for request assertions.
 * @throws Testing Library errors if the upload form cannot be opened.
 */
async function submitReplacement(): Promise<File> {
    fireEvent.click(screen.getAllByRole('button', { name: 'Submit a solution' })[0])
    const input = await screen.findByLabelText(/Upload File\*/)
    const file = new File(['zip'], 'replacement.zip', { type: 'application/zip' })
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'I understand and agree' }))
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    })
    return file
}

describe('PM-5987 Design submission replacement without reloading', () => {
    beforeEach(() => {
        jest.resetAllMocks()
        jest.spyOn(window, 'scrollTo')
            .mockImplementation(() => undefined)
        jest.spyOn(window, 'confirm')
            .mockReturnValue(true)
        mockGetRegistration.mockResolvedValue({ id: 'registration-id', memberId: '123' })
        mockGetChallenge.mockImplementation(async () => ({ ...challenge }))
        mockGetSubmissions.mockImplementation(async (_challengeId, page, perPage) => ({
            items: submissions.slice((page - 1) * perPage, page * perPage),
            page,
            perPage,
            total: submissions.length,
            totalPages: Math.ceil(submissions.length / perPage),
        }))
        mockDeleteSubmission.mockImplementation(async submissionId => {
            submissions = submissions.filter(submission => submission.id !== submissionId)
        })
        mockCreateSubmission.mockImplementation(async (challengeId, memberId, type) => {
            // Review API remains authoritative for the current phase's submission limit.
            if (submissions.filter(submission => submission.type === type).length >= submissionLimit) {
                throw new Error(LIMIT_ERROR)
            }

            const submission = { challengeId, id: 'replacement-id', memberId, type }
            submissions = [submission, ...submissions]
            return submission
        })
    })

    afterEach(() => jest.restoreAllMocks())

    it.each<[string, ChallengeSubmissionType, number]>([
        ['Submission', 'CONTEST_SUBMISSION', 1],
        ['Submission', 'CONTEST_SUBMISSION', 3],
        ['Checkpoint Submission', 'CHECKPOINT_SUBMISSION', 1],
        ['Checkpoint Submission', 'CHECKPOINT_SUBMISSION', 3],
    ])('replaces a %s (%s) at limit %i and keeps counts current', async (phase, type, limit) => {
        await renderSubmissions(phase, type, limit)
        fireEvent.click(screen.getByRole('button', { name: 'Delete submission submission-1' }))
        await waitFor(() => expect(toast.success)
            .toHaveBeenCalledWith('Submission deleted.'))
        expect(screen.queryByText('submission-1')).not.toBeInTheDocument()

        const file = await submitReplacement()
        await screen.findByText('Your solutions has been submitted')
        expect(mockCreateSubmission)
            .toHaveBeenCalledWith(
                'challenge-id',
                '123',
                type,
                file,
                expect.any(Function),
                expect.any(AbortSignal),
            )
        expect(toast.error).not.toHaveBeenCalled()
        expect(screen.queryByText(LIMIT_ERROR)).not.toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /^My Submissions/ }))
            .toHaveTextContent(`My Submissions${limit}`)
        expect(screen.getByRole('tab', { name: /^Submissions/ }))
            .toHaveTextContent(`Submissions${limit + OTHER_MEMBER_SUBMISSIONS}`)

        fireEvent.click(screen.getByRole('button', { name: 'Back to submissions' }))
        await screen.findByRole('button', { name: 'Delete submission replacement-id' })
        expect(screen.queryByText('submission-1')).not.toBeInTheDocument()
        expect(screen.getAllByRole('button', { name: /^Delete submission/ }))
            .toHaveLength(limit)
    })

    it('clears the member count and permits unregistering after deleting the last submission', async () => {
        await renderSubmissions('Submission', 'CONTEST_SUBMISSION', 1)
        expect(screen.getByRole('button', { name: 'Unregister' }))
            .toBeDisabled()
        fireEvent.click(screen.getByRole('button', { name: 'Delete submission submission-1' }))

        await screen.findByText('You have no submissions yet')
        await waitFor(() => expect(screen.getByRole('tab', { name: /^My Submissions/ }))
            .toHaveTextContent(/^My Submissions$/))
        expect(screen.getByRole('tab', { name: /^Submissions/ }))
            .toHaveTextContent(`Submissions${OTHER_MEMBER_SUBMISSIONS}`)
        expect(screen.getByRole('button', { name: 'Unregister' }))
            .toBeEnabled()
    })

    it('preserves the submission and counts when deletion fails', async () => {
        mockDeleteSubmission.mockRejectedValueOnce(new Error('Unable to delete this submission.'))
        await renderSubmissions()
        fireEvent.click(screen.getByRole('button', { name: 'Delete submission submission-1' }))

        await waitFor(() => expect(toast.error)
            .toHaveBeenCalledWith('Unable to delete this submission.'))
        expect(screen.getByRole('button', { name: 'Delete submission submission-1' }))
            .toBeEnabled()
        expect(screen.getByRole('tab', { name: /^My Submissions/ }))
            .toHaveTextContent('My Submissions3')
        expect(screen.getByRole('tab', { name: /^Submissions/ }))
            .toHaveTextContent('Submissions5')
        expect(toast.success).not.toHaveBeenCalled()
    })

    it('preserves the submission and counts when deletion is cancelled', async () => {
        jest.spyOn(window, 'confirm')
            .mockReturnValue(false)
        await renderSubmissions()
        fireEvent.click(screen.getByRole('button', { name: 'Delete submission submission-1' }))

        expect(mockDeleteSubmission).not.toHaveBeenCalled()
        expect(screen.getByRole('button', { name: 'Delete submission submission-1' }))
            .toBeEnabled()
        expect(screen.getByRole('tab', { name: /^My Submissions/ }))
            .toHaveTextContent('My Submissions3')
        expect(screen.getByRole('tab', { name: /^Submissions/ }))
            .toHaveTextContent('Submissions5')
    })

    it('still displays a limit error returned by Review API when no slot was freed', async () => {
        await renderSubmissions()
        await submitReplacement()

        await screen.findByText(LIMIT_ERROR)
        expect(screen.queryByText('Your solutions has been submitted')).not.toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /^My Submissions/ }))
            .toHaveTextContent('My Submissions3')
        expect(screen.getByRole('tab', { name: /^Submissions/ }))
            .toHaveTextContent('Submissions5')
    })
})
