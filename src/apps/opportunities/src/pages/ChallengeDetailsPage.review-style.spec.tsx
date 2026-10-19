/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import '@testing-library/jest-dom'
import { act, PropsWithChildren } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SWRConfig } from 'swr'

import { ChallengeAiReviewConfig, ChallengeOpportunity, ChallengeResource } from '../models'
import {
    getChallengeAiReviewConfig,
    getChallengeOpportunity,
    getChallengeRegistration,
    getChallengeSubmissions,
    registerForChallenge,
    unregisterFromChallenge,
} from '../services'

import { ChallengeDetailsPage } from './ChallengeDetailsPage'

let mockProfile: { handle: string; userId: number } | undefined

jest.mock('~/config', () => ({
    AppSubdomain: { topgear: 'topgear' },
    EnvironmentConfig: {
        ADMIN: { ONLINE_REVIEW_URL: 'https://review.topcoder-dev.com' },
        REVIEW_APP_URL: 'https://review.topcoder-dev.com',
        TOPCODER_URL: 'https://www.topcoder-dev.com',
        URLS: { TERMS_OF_USE: 'https://www.topcoder-dev.com/terms' },
        VANILLA_FORUM: { V2_URL: 'https://discussions.topcoder-dev.com' },
    },
}), { virtual: true })
jest.mock('~/libs/core', () => ({
    recordAnalyticsEvent: jest.fn(),
    useProfileContext: () => ({ initialized: true, profile: mockProfile }),
}), { virtual: true })
jest.mock('~/libs/cms', () => ({}), { virtual: true })
jest.mock('~/libs/ui', () => {
    /** Returns a placeholder icon for the real header and sidebar; takes no inputs and never throws. */
    const Icon = (): JSX.Element => <svg />
    return {
        ConfirmModal: (props: PropsWithChildren<{
            onConfirm: () => void
            open: boolean
            title: string
        }>): JSX.Element => (
            props.open ? (
                <div aria-label={props.title} role='dialog'>
                    {props.children}
                    <button onClick={props.onConfirm} type='button'>Confirm</button>
                </div>
            ) : <></>
        ),
        IconOutline: new Proxy({}, { get: () => Icon }),
        LoadingSpinner: (): JSX.Element => <span>Loading</span>,
        Tooltip: (props: PropsWithChildren): JSX.Element => <>{props.children}</>,
    }
}, { virtual: true })
jest.mock('react-toastify', () => ({
    toast: { error: jest.fn(), success: jest.fn() },
}))
jest.mock('../components', () => ({
    ChallengeDescription: (): JSX.Element => <div>Requirements</div>,
    ChallengeDetailHeader: jest.requireActual('../components/ChallengeDetailHeader').ChallengeDetailHeader,
    ChallengeSidebar: jest.requireActual('../components/ChallengeSidebar').ChallengeSidebar,
    ChallengeTermsModal: (props: { onComplete: () => Promise<void>; open: boolean }): JSX.Element => (
        props.open ? <button onClick={props.onComplete} type='button'>Complete terms</button> : <></>
    ),
    extractTableOfContents: (): [] => [],
    isHtmlDescriptionFormat: (): boolean => false,
    ReportIssueModal: (): JSX.Element => <></>,
}))
jest.mock('../services', () => ({
    getChallengeAiReviewConfig: jest.fn(),
    getChallengeForumTopics: jest.fn(),
    getChallengeMemberResource: jest.fn(),
    getChallengeOpportunity: jest.fn(),
    getChallengeRegistration: jest.fn(),
    getChallengeSubmissions: jest.fn(),
    registerForChallenge: jest.fn(),
    unregisterFromChallenge: jest.fn(),
}))

const mockGetConfig = getChallengeAiReviewConfig as jest.MockedFunction<typeof getChallengeAiReviewConfig>
const mockGetChallenge = getChallengeOpportunity as jest.MockedFunction<typeof getChallengeOpportunity>
const mockGetRegistration = getChallengeRegistration as jest.MockedFunction<typeof getChallengeRegistration>
const mockRegister = registerForChallenge as jest.MockedFunction<typeof registerForChallenge>
const mockUnregister = unregisterFromChallenge as jest.MockedFunction<typeof unregisterFromChallenge>
const challenge: ChallengeOpportunity = {
    id: 'challenge-id',
    name: 'Review style challenge',
    phases: [{ isOpen: true, name: 'Registration' }],
    status: 'ACTIVE',
    terms: [{ id: 'terms-id', title: 'Standard Terms 2026' }],
    track: 'Development',
    type: 'Challenge',
}
const registration: ChallengeResource = { id: 'registration-id', memberId: '123' }
const aiConfig: ChallengeAiReviewConfig = {
    challengeId: challenge.id,
    id: 'config-id',
    instantReview: false,
    mode: 'AI_GATING',
}

/**
 * Mounts the real detail page, header, sidebar, and SWR with an isolated cache.
 *
 * @returns promise settled after initial requests and React updates complete.
 * @throws Propagates rendering errors so the regression test fails.
 */
async function renderDetails(): Promise<void> {
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
}

describe('PM-6368 registration-gated review style', () => {
    beforeEach(() => {
        jest.resetAllMocks()
        jest.spyOn(window, 'scrollTo')
            .mockImplementation(() => undefined)
        mockProfile = { handle: 'coder', userId: 123 }
        mockGetChallenge.mockResolvedValue(challenge)
        mockGetRegistration.mockResolvedValue(undefined)
        mockGetConfig.mockResolvedValue(aiConfig)
        jest.mocked(getChallengeSubmissions)
            .mockResolvedValue({ items: [], page: 1, perPage: 1, total: 0, totalPages: 0 })
        mockRegister.mockResolvedValue(registration)
        mockUnregister.mockResolvedValue(undefined)
    })

    afterEach(() => jest.restoreAllMocks())

    it.each([true, false])('hides review style before registration (logged in: %s)', async loggedIn => {
        if (!loggedIn) mockProfile = undefined
        await renderDetails()

        expect(screen.queryByRole('heading', { name: 'Review Style' })).not.toBeInTheDocument()
        expect(screen.queryByText('Review configuration is unavailable.')).not.toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Challenge Terms' }))
            .toBeInTheDocument()
        expect(mockGetConfig).not.toHaveBeenCalled()
    })

    it('waits for registration verification before fetching review configuration', async () => {
        let resolveRegistration: (value: ChallengeResource) => void = () => undefined
        mockGetRegistration.mockReturnValue(new Promise(resolve => { resolveRegistration = resolve }))
        await renderDetails()

        expect(screen.queryByRole('heading', { name: 'Review Style' })).not.toBeInTheDocument()
        expect(mockGetConfig).not.toHaveBeenCalled()
        await act(async () => resolveRegistration(registration))
        expect(await screen.findByText('AI Gating'))
            .toBeInTheDocument()
        expect(mockGetConfig)
            .toHaveBeenCalledWith(challenge.id)
    })

    it('loads review style after registration without reloading and hides it after unregistering', async () => {
        let resolveConfig: (value: ChallengeAiReviewConfig) => void = () => undefined
        mockGetConfig.mockReturnValue(new Promise(resolve => { resolveConfig = resolve }))
        await renderDetails()
        expect(mockGetConfig).not.toHaveBeenCalled()

        fireEvent.click(screen.getByRole('button', { name: 'Register' }))
        fireEvent.click(await screen.findByRole('button', { name: 'Complete terms' }))
        expect(await screen.findByText('Loading review configuration…'))
            .toBeInTheDocument()
        expect(mockRegister)
            .toHaveBeenCalledWith(challenge.id, 'coder')
        expect(mockGetConfig)
            .toHaveBeenCalledTimes(1)

        await act(async () => resolveConfig(aiConfig))
        expect(await screen.findByText('AI Gating'))
            .toBeInTheDocument()
        expect(screen.getByText('Instant Review is Off'))
            .toBeInTheDocument()
        expect(screen.queryByText('Review configuration is unavailable.')).not.toBeInTheDocument()
        expect(mockGetChallenge)
            .toHaveBeenCalledTimes(1)

        fireEvent.click(screen.getByRole('button', { name: 'Unregister' }))
        fireEvent.click(within(screen.getByRole('dialog', { name: 'Unregister from competition?' }))
            .getByRole('button', { name: 'Confirm' }))
        await waitFor(() => expect(screen.queryByRole('heading', { name: 'Review Style' }))
            .not.toBeInTheDocument())
        expect(mockUnregister)
            .toHaveBeenCalledWith(challenge.id, 'coder')
        expect(screen.getByRole('heading', { name: 'Challenge Terms' }))
            .toBeInTheDocument()
    })

    it('keeps review style hidden when registration fails', async () => {
        mockRegister.mockRejectedValue(new Error('Registration failed.'))
        await renderDetails()
        fireEvent.click(screen.getByRole('button', { name: 'Register' }))
        await act(async () => {
            fireEvent.click(await screen.findByRole('button', { name: 'Complete terms' }))
        })

        expect(mockRegister)
            .toHaveBeenCalled()
        expect(screen.queryByRole('heading', { name: 'Review Style' })).not.toBeInTheDocument()
        expect(mockGetConfig).not.toHaveBeenCalled()
    })

    it('preserves manual review for registered members when no AI configuration exists', async () => {
        mockGetRegistration.mockResolvedValue(registration)
        mockGetConfig.mockResolvedValue(undefined)
        await renderDetails()

        expect(await screen.findByText('Manual'))
            .toBeInTheDocument()
        expect(screen.queryByText(/Instant Review is/)).not.toBeInTheDocument()
    })

    it('preserves the unavailable message for registered members when the request fails', async () => {
        mockGetRegistration.mockResolvedValue(registration)
        mockGetConfig.mockRejectedValue(new Error('Review service unavailable.'))
        await renderDetails()

        expect(await screen.findByText('Review configuration is unavailable.'))
            .toBeInTheDocument()
        expect(screen.queryByText('Manual')).not.toBeInTheDocument()
    })

    it.each(['Design', 'Marathon Match'])('does not fetch review style for registered %s members', async kind => {
        mockGetRegistration.mockResolvedValue(registration)
        mockGetChallenge.mockResolvedValue({
            ...challenge,
            track: kind === 'Design' ? 'Design' : 'Development',
            type: kind === 'Marathon Match' ? 'Marathon Match' : 'Challenge',
        })
        await renderDetails()

        expect(screen.queryByRole('heading', { name: 'Review Style' })).not.toBeInTheDocument()
        expect(mockGetConfig).not.toHaveBeenCalled()
    })
})
