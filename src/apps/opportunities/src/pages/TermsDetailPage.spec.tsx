/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import '@testing-library/jest-dom'
import { PropsWithChildren, ReactNode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SWRConfig } from 'swr'

import { ChallengeTerm } from '../models'
import TermsDetailPage from './TermsDetailPage'

const STANDARD_ID = '0a507fb7-3fe0-402b-b121-1a24af4a9cf1'
const NDA_ID = '4bc0e7fc-8413-4de6-a231-9f9c6bcc65d9'
let mockTerm: ChallengeTerm
let mockProfile: { userId: number } | undefined
let mockInitialized: boolean
let mockLoggedIn: boolean
const mockGetTerm = jest.fn()
const mockGetOutstandingTerms = jest.fn()
const mockAgree = jest.fn()
const mockGetDocuSignUrl = jest.fn()
const mockGetSubmitterTerms = jest.fn()

jest.mock('../services', () => ({
    agreeToChallengeTerms: (...args: unknown[]) => mockAgree(...args),
    getChallengeSubmitterTermsDetails: (...args: unknown[]) => mockGetSubmitterTerms(...args),
    getChallengeTermDetails: (...args: unknown[]) => mockGetTerm(...args),
    getChallengeTermDocuSignUrl: (...args: unknown[]) => mockGetDocuSignUrl(...args),
    getChallengeTermsDetails: jest.fn(),
    getOutstandingTermsDetails: (...args: unknown[]) => mockGetOutstandingTerms(...args),
}))

jest.mock('../opportunities.routes', () => ({ rootRoute: '/opportunities' }))
jest.mock('~/libs/core', () => ({
    authUrlLogin: (url: string): string => `https://accounts.example?retUrl=${encodeURIComponent(url)}`,
    useProfileContext: () => ({ initialized: mockInitialized, isLoggedIn: mockLoggedIn, profile: mockProfile }),
}), { virtual: true })
jest.mock('~/config', () => ({
    AppSubdomain: { opportunities: 'opportunities' },
    EnvironmentConfig: { SUBDOMAIN: 'www' },
}), { virtual: true })
jest.mock('~/libs/cms', () => ({ getSafeCmsLink: () => undefined }), { virtual: true })
jest.mock('~/libs/ui', () => ({
    BaseModal: (props: PropsWithChildren<{
        buttons?: ReactNode
        onClose: () => void
        title: string
    }>): JSX.Element => (
        <div aria-label={props.title} role='dialog'>
            <button aria-label='Close modal' onClick={props.onClose} type='button' />
            {props.children}
            {props.buttons}
        </div>
    ),
    Button: (props: { disabled?: boolean; label: string; onClick?: () => void }): JSX.Element => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>{props.label}</button>
    ),
    LoadingSpinner: (): JSX.Element => <span>Loading</span>,
}), { virtual: true })

/**
 * Mounts the real page, agreement modal, and SWR cache at an email deep link.
 *
 * @param termId agreement identifier used in the route.
 * @returns rendered view for user interaction and member-switch assertions.
 * @throws Propagates rendering failures to Jest.
 */
function renderPage(termId: string = STANDARD_ID): ReturnType<typeof render> {
    return render(<TermsDetailPage />, {
        wrapper: (props: PropsWithChildren<{}>): JSX.Element => (
            <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map(), shouldRetryOnError: false }}>
                <MemoryRouter initialEntries={[`/opportunities/terms/detail/${termId}`]}>
                    <Routes>
                        <Route element={props.children} path='/opportunities/terms/detail/:termId' />
                    </Routes>
                </MemoryRouter>
            </SWRConfig>
        ),
    })
}

describe('standalone Terms and NDA pages', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockProfile = { userId: 42 }
        mockInitialized = true
        mockLoggedIn = true
        mockTerm = {
            agreeabilityType: 'Electronically-agreeable',
            agreed: false,
            id: STANDARD_ID,
            text: '<p style="color:red" onclick="alert(1)">The 2026 standard terms.</p><script>alert(1)</script>',
            title: 'Standard Terms 2026',
        }
        mockGetTerm.mockReset()
            .mockImplementation(async () => mockTerm)
        mockGetOutstandingTerms.mockReset()
            .mockImplementation(async () => (mockTerm.agreed ? [] : [mockTerm]))
        mockAgree.mockReset()
            .mockResolvedValue(undefined)
        mockGetDocuSignUrl.mockReset()
            .mockResolvedValue('https://docusign.example/recipient')
    })

    it('loads the email term, sanitizes its HTML, and saves only after explicit agreement', async () => {
        renderPage()
        expect(await screen.findByRole('heading', { name: 'Standard Terms 2026' }))
            .toBeInTheDocument()
        expect(mockGetTerm)
            .toHaveBeenCalledWith({ id: STANDARD_ID }, { fresh: true })
        const body = screen.getByText('The 2026 standard terms.')
        expect(body)
            .not.toHaveAttribute('style')
        expect(body)
            .not.toHaveAttribute('onclick')
        expect(document.querySelector('script'))
            .not.toBeInTheDocument()
        expect(mockAgree)
            .not.toHaveBeenCalled()

        fireEvent.click(screen.getByRole('button', { name: 'Review and accept' }))
        await waitFor(() => expect(screen.getByRole('button', { name: 'I agree' }))
            .toBeEnabled())
        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))
        await waitFor(() => expect(screen.getByRole('status'))
            .toHaveTextContent('You have accepted this agreement.'))
        expect(mockAgree)
            .toHaveBeenCalledWith([mockTerm])
        expect(mockGetSubmitterTerms)
            .not.toHaveBeenCalled()
        expect(screen.queryByRole('dialog'))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Register' }))
            .not.toBeInTheDocument()
    })

    it('allows public reading and preserves the full link for sign-in without agreement requests', async () => {
        mockProfile = undefined
        window.history.replaceState({}, '', `/opportunities/terms/detail/${STANDARD_ID}?source=email#terms`)
        renderPage()
        const signIn = await screen.findByRole('link', { name: 'Sign in to accept this agreement' })
        expect(signIn)
            .toHaveAttribute('href', `https://accounts.example?retUrl=${encodeURIComponent(window.location.href)}`)
        expect(screen.getByText('The 2026 standard terms.'))
            .toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Review and accept' }))
            .not.toBeInTheDocument()
        expect(mockAgree)
            .not.toHaveBeenCalled()
        expect(mockGetDocuSignUrl)
            .not.toHaveBeenCalled()
    })

    it('requires an active login even when a stale profile remains available', async () => {
        mockLoggedIn = false
        renderPage()
        expect(await screen.findByRole('link', { name: 'Sign in to accept this agreement' }))
            .toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Review and accept' }))
            .not.toBeInTheDocument()
        expect(mockAgree)
            .not.toHaveBeenCalled()
    })

    it('does not create an anonymous DocuSign session', async () => {
        mockProfile = undefined
        mockLoggedIn = false
        mockTerm = { agreed: false, docusignTemplateId: 'nda-template', id: NDA_ID, title: 'NDA' }
        renderPage(NDA_ID)
        expect(await screen.findByRole('link', { name: 'Sign in to accept this agreement' }))
            .toBeInTheDocument()
        expect(document.querySelector('iframe'))
            .not.toBeInTheDocument()
        expect(mockGetDocuSignUrl)
            .not.toHaveBeenCalled()
    })

    it.each([401, 403])('never reports acceptance after HTTP %s', async status => {
        mockAgree.mockRejectedValueOnce({ response: { status } })
        // An authorization failure must not be converted to success by a later status read.
        mockGetOutstandingTerms.mockResolvedValueOnce([mockTerm])
            .mockResolvedValue([])
        renderPage()
        fireEvent.click(await screen.findByRole('button', { name: 'Review and accept' }))
        await waitFor(() => expect(screen.getByRole('button', { name: 'I agree' }))
            .toBeEnabled())
        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))
        expect(await screen.findByRole('alert'))
            .toHaveTextContent('record your agreement')
        expect(screen.queryByText(/You have accepted this agreement/)).not.toBeInTheDocument()
        expect(mockGetOutstandingTerms)
            .toHaveBeenCalledTimes(1)
    })

    it('removes the DocuSign frame and ignores its late callback after logout', async () => {
        mockTerm = { agreed: false, docusignTemplateId: 'nda-template', id: NDA_ID, title: 'NDA' }
        const view = renderPage(NDA_ID)
        fireEvent.click(await screen.findByRole('button', { name: 'Review and sign' }))
        const frame = await screen.findByTitle('NDA') as HTMLIFrameElement
        const source = frame.contentWindow
        mockLoggedIn = false
        view.rerender(<TermsDetailPage />)
        expect(await screen.findByRole('link', { name: 'Sign in to accept this agreement' }))
            .toBeInTheDocument()
        expect(document.querySelector('iframe')).not.toBeInTheDocument()
        fireEvent(window, new MessageEvent('message', {
            data: { event: 'signing_complete', type: 'DocuSign' },
            origin: window.location.origin,
            source,
        }))
        expect(screen.queryByText(/You have accepted this agreement/)).not.toBeInTheDocument()
        expect(mockGetOutstandingTerms)
            .toHaveBeenCalledTimes(1)
    })

    it('waits for authentication initialization before reading member agreement state', () => {
        mockInitialized = false
        renderPage()
        expect(screen.getByRole('status'))
            .toHaveTextContent('Loading agreement')
        expect(mockGetTerm)
            .not.toHaveBeenCalled()
    })

    it('shows an accepted agreement without prompting or creating another recipient view', async () => {
        mockTerm = { agreed: true, docusignTemplateId: 'nda-template', id: NDA_ID, title: 'Topcoder NDA 2026' }
        renderPage(NDA_ID)
        expect(await screen.findByText(/You have accepted this agreement/))
            .toBeInTheDocument()
        expect(mockGetDocuSignUrl)
            .not.toHaveBeenCalled()
        expect(screen.queryByRole('button', { name: 'Review and sign' }))
            .not.toBeInTheDocument()
    })

    it('retries a failed or unknown term without allowing acceptance of incomplete content', async () => {
        mockGetTerm.mockRejectedValueOnce(new Error('Not found'))
        renderPage('missing-term')
        expect(await screen.findByRole('alert'))
            .toHaveTextContent('check the link or try again')
        expect(screen.queryByRole('button', { name: 'Review and accept' }))
            .not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
        expect(await screen.findByText('The 2026 standard terms.'))
            .toBeInTheDocument()
    })

    it('keeps a rejected electronic agreement pending and allows retry', async () => {
        mockAgree.mockRejectedValueOnce(new Error('Agreement failed'))
        renderPage()
        fireEvent.click(await screen.findByRole('button', { name: 'Review and accept' }))
        await waitFor(() => expect(screen.getByRole('button', { name: 'I agree' }))
            .toBeEnabled())
        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))
        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Agreement failed')
        expect(screen.queryByText(/You have accepted this agreement/))
            .not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))
        expect(await screen.findByText(/You have accepted this agreement/))
            .toBeInTheDocument()
    })

    it('waits for authoritative NDA acceptance after the trusted DocuSign callback', async () => {
        mockTerm = { agreed: false, docusignTemplateId: 'nda-template', id: NDA_ID, title: 'Topcoder NDA 2026' }
        let confirmSignature: (terms: ChallengeTerm[]) => void = () => undefined
        mockGetOutstandingTerms.mockResolvedValueOnce([mockTerm])
            .mockImplementationOnce(() => new Promise(resolve => { confirmSignature = resolve }))
        renderPage(NDA_ID)
        fireEvent.click(await screen.findByRole('button', { name: 'Review and sign' }))
        const frame = await screen.findByTitle('Topcoder NDA 2026')
        expect(mockGetDocuSignUrl)
            .toHaveBeenCalledWith('nda-template', `${window.location.origin}/opportunities/terms/docusign-return`)
        fireEvent(window, new MessageEvent('message', {
            data: { event: 'signing_complete', type: 'DocuSign' },
            origin: window.location.origin,
            source: (frame as HTMLIFrameElement).contentWindow,
        }))
        expect(await screen.findByText('Confirming your signature…'))
            .toBeInTheDocument()
        expect(screen.queryByText(/You have accepted this agreement/))
            .not.toBeInTheDocument()
        await act(async () => confirmSignature([]))
        expect(await screen.findByText(/You have accepted this agreement/))
            .toBeInTheDocument()
        expect(mockGetOutstandingTerms)
            .toHaveBeenLastCalledWith([{ id: NDA_ID, title: 'Topcoder NDA 2026' }], expect.objectContaining({
                fresh: true,
                timeoutMs: 10000,
            }))
        expect(mockGetSubmitterTerms)
            .not.toHaveBeenCalled()
        expect(mockAgree)
            .not.toHaveBeenCalled()
    })

    it('keeps the NDA pending when the member cancels DocuSign', async () => {
        mockTerm = { agreed: false, docusignTemplateId: 'nda-template', id: NDA_ID, title: 'Topcoder NDA 2026' }
        renderPage(NDA_ID)
        fireEvent.click(await screen.findByRole('button', { name: 'Review and sign' }))
        const frame = await screen.findByTitle('Topcoder NDA 2026')
        fireEvent(window, new MessageEvent('message', {
            data: { event: 'cancel', type: 'DocuSign' },
            origin: window.location.origin,
            source: (frame as HTMLIFrameElement).contentWindow,
        }))
        await waitFor(() => expect(screen.queryByRole('dialog'))
            .not.toBeInTheDocument())
        expect(screen.queryByText(/You have accepted this agreement/))
            .not.toBeInTheDocument()
        expect(mockAgree)
            .not.toHaveBeenCalled()
    })

    it('discards an open agreement and stale completion when the signed-in member changes', async () => {
        let finishOldAgreement: () => void = () => undefined
        mockAgree.mockImplementationOnce(() => new Promise<void>(resolve => { finishOldAgreement = resolve }))
        const view = renderPage()
        fireEvent.click(await screen.findByRole('button', { name: 'Review and accept' }))
        await waitFor(() => expect(screen.getByRole('button', { name: 'I agree' }))
            .toBeEnabled())
        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))
        await waitFor(() => expect(mockAgree)
            .toHaveBeenCalledTimes(1))

        mockProfile = { userId: 99 }
        view.rerender(<TermsDetailPage />)
        expect(await screen.findByRole('button', { name: 'Review and accept' }))
            .toBeInTheDocument()
        await act(async () => finishOldAgreement())
        expect(screen.queryByText(/You have accepted this agreement/))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('dialog'))
            .not.toBeInTheDocument()
        expect(mockGetTerm)
            .toHaveBeenCalledTimes(2)
    })
})
