/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import {
    PropsWithChildren,
    ReactNode,
} from 'react'
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import { ChallengeTerm } from '../models'

import { ChallengeTermsModal } from './ChallengeTermsModal'

interface MockSWRResponse {
    data?: ChallengeTerm[]
    error?: Error
    isValidating: boolean
    mutate: jest.Mock
}

let mockSWRResponse: MockSWRResponse
const mockBaseModal = jest.fn()
const mockAgreeToTerms = jest.fn()
const mockGetDocuSignUrl = jest.fn()
const mockGetSubmitterTermsDetails = jest.fn()
const mockMutateTermsCache = jest.fn()
const mockUseSWR = jest.fn()

jest.mock('swr', () => ({
    __esModule: true,
    default: (...args: unknown[]): MockSWRResponse => {
        mockUseSWR(...args)
        return mockSWRResponse
    },
    useSWRConfig: (): { mutate: jest.Mock } => ({ mutate: mockMutateTermsCache }),
}))

jest.mock('../services', () => ({
    agreeToChallengeTerms: (...args: unknown[]) => mockAgreeToTerms(...args),
    getChallengeSubmitterTermsDetails: (...args: unknown[]) => mockGetSubmitterTermsDetails(...args),
    getChallengeTermDocuSignUrl: (...args: unknown[]) => mockGetDocuSignUrl(...args),
    getChallengeTermsDetails: jest.fn(),
}))

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        COMMUNITY_APP_URL: 'https://www.topcoder-dev.com/',
        NDA_DOCUSIGN_TEMPLATE_ID: 'configured-nda-template',
    },
}), { virtual: true })

jest.mock('~/libs/cms', () => ({
    getSafeCmsLink: (value: string): string => value,
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: PropsWithChildren<{
        buttons?: ReactNode
        onClose: () => void
        open: boolean
        title: string
    }>): JSX.Element => {
        mockBaseModal(props)
        return (
            <>
                {props.open && (
                    <div aria-label={props.title} role='dialog'>
                        <button aria-label='Close modal' onClick={props.onClose} type='button' />
                        {props.children}
                        {props.buttons}
                    </div>
                )}
            </>
        )
    },
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
    }): JSX.Element => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>{props.label}</button>
    ),
    LoadingSpinner: (): JSX.Element => <span>Loading</span>,
}), { virtual: true })

describe('ChallengeTermsModal', () => {
    beforeEach(() => {
        mockBaseModal.mockClear()
        mockAgreeToTerms.mockReset()
        mockAgreeToTerms.mockResolvedValue(undefined)
        mockGetDocuSignUrl.mockReset()
        mockGetDocuSignUrl.mockResolvedValue('https://docusign.example/recipient')
        mockGetSubmitterTermsDetails.mockReset()
        mockMutateTermsCache.mockReset()
        mockMutateTermsCache.mockImplementation(async (_key, update) => (typeof update === 'function'
            ? update(mockSWRResponse.data)
            : update))
        mockUseSWR.mockClear()
        mockSWRResponse = {
            data: undefined,
            error: undefined,
            isValidating: true,
            mutate: jest.fn(),
        }
    })

    afterEach(() => {
        jest.useRealTimers()
        jest.restoreAllMocks()
    })

    it('does not flash unresolved terms before showing the compact registration reminder', () => {
        const props = {
            mode: 'register' as const,
            onClose: jest.fn(),
            onComplete: jest.fn(),
            open: true,
            terms: [{ id: 'standard-terms', title: 'Challenge Terms' }],
        }
        const view = render(<ChallengeTermsModal {...props} />)

        expect(screen.queryByRole('dialog'))
            .not.toBeInTheDocument()

        mockSWRResponse = {
            ...mockSWRResponse,
            data: [],
            isValidating: false,
        }
        view.rerender(<ChallengeTermsModal {...props} />)

        expect(screen.getByRole('dialog', { name: 'Important Reminder' }))
            .toBeInTheDocument()
    })

    it('waits for registration terms even before SWR reports validation in progress', () => {
        mockSWRResponse = {
            ...mockSWRResponse,
            isValidating: false,
        }

        render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={jest.fn()}
                open
                terms={[{ id: 'standard-terms', title: 'Challenge Terms' }]}
            />,
        )

        expect(mockBaseModal)
            .not.toHaveBeenCalled()
        expect(screen.queryByRole('dialog'))
            .not.toBeInTheDocument()
    })

    it('unmounts resolved registration content immediately when closing', () => {
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [],
            isValidating: false,
        }
        const props = {
            mode: 'register' as const,
            onClose: jest.fn(),
            onComplete: jest.fn(),
            terms: [{ id: 'standard-terms', title: 'Challenge Terms' }],
        }
        const view = render(<ChallengeTermsModal {...props} open />)

        expect(screen.getByRole('dialog', { name: 'Important Reminder' }))
            .toBeInTheDocument()
        const openRenderCount = mockBaseModal.mock.calls.length

        view.rerender(<ChallengeTermsModal {...props} open={false} />)

        expect(mockBaseModal)
            .toHaveBeenCalledTimes(openRenderCount)
        expect(screen.queryByRole('dialog'))
            .not.toBeInTheDocument()
    })

    it('does not flash stale hydrated terms while a new registration request is loading', () => {
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [{ id: 'previous-terms', title: 'Challenge Terms' }],
            isValidating: true,
        }

        render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={jest.fn()}
                open
                terms={[{ id: 'current-terms', title: 'Challenge Terms' }]}
            />,
        )

        expect(screen.queryByRole('dialog'))
            .not.toBeInTheDocument()
    })

    it('embeds the configured DocuSign NDA after persisting Standard Terms', async () => {
        const addEventListener = jest.spyOn(window, 'addEventListener')
        const standardTerms: ChallengeTerm = {
            agreeabilityType: 'Electronically-agreeable',
            id: 'standard-terms',
            text: '<p>Standard terms body</p>',
            title: 'Standard Terms 2026',
        }
        const nda: ChallengeTerm = {
            agreeabilityType: 'Electronically-agreeable',
            id: 'nda',
            text: 'Test',
            title: 'Topcoder Member Non-Disclosure Agreement v3.0',
        }
        const onComplete = jest.fn()
            .mockResolvedValue(undefined)
        mockGetSubmitterTermsDetails.mockResolvedValueOnce([])
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [standardTerms, nda],
            isValidating: false,
        }

        render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={onComplete}
                open
                terms={[standardTerms, nda]}
            />,
        )

        expect(screen.getByRole('dialog', { name: 'Standard Terms 2026' }))
            .toBeInTheDocument()
        expect(screen.getByText('Agreement 1 of 2'))
            .toBeInTheDocument()
        expect(screen.getByText('Standard terms body'))
            .toBeInTheDocument()
        expect(screen.queryByText('Test'))
            .not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))

        await waitFor(() => expect(mockAgreeToTerms)
            .toHaveBeenNthCalledWith(1, [standardTerms]))
        expect(onComplete)
            .not.toHaveBeenCalled()
        expect(await screen.findByRole('dialog', {
            name: 'Topcoder Member Non-Disclosure Agreement v3.0',
        }))
            .toBeInTheDocument()
        expect(screen.getByText('Agreement 2 of 2'))
            .toBeInTheDocument()
        await waitFor(() => expect(screen.queryByText('Loading DocuSign agreement…'))
            .not.toBeInTheDocument())
        const frame = screen.getByTitle('Topcoder Member Non-Disclosure Agreement v3.0')
        await waitFor(() => expect(addEventListener)
            .toHaveBeenCalledWith('message', expect.any(Function)))
        expect(frame)
            .toHaveAttribute('src', 'https://docusign.example/recipient')
        expect(mockGetDocuSignUrl)
            .toHaveBeenCalledWith(
                'configured-nda-template',
                'https://www.topcoder-dev.com/community-app-assets/iframe-break',
            )
        expect(screen.queryByText('Test'))
            .not.toBeInTheDocument()
        expect(screen.queryByText('Standard terms body'))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'I agree' }))
            .not.toBeInTheDocument()

        fireEvent(window, new MessageEvent('message', {
            data: { event: 'signing_complete', type: 'DocuSign' },
            origin: 'https://www.topcoder-dev.com',
            source: (frame as HTMLIFrameElement).contentWindow,
        }))

        await waitFor(() => expect(onComplete)
            .toHaveBeenCalledTimes(1))
        expect(mockAgreeToTerms)
            .toHaveBeenCalledTimes(1)
        expect(mockGetSubmitterTermsDetails)
            .toHaveBeenCalledWith([standardTerms, nda], expect.objectContaining({
                fresh: true,
                signal: expect.objectContaining({ aborted: false }),
                timeoutMs: 10000,
            }))
        addEventListener.mockRestore()
    })

    it('keeps an earlier term outstanding when the server returns it after DocuSign completion', async () => {
        const addEventListener = jest.spyOn(window, 'addEventListener')
        const standardTerms: ChallengeTerm = {
            agreeabilityType: 'Electronically-agreeable',
            id: 'standard-terms',
            text: '<p>Standard terms body</p>',
            title: 'Standard Terms 2026',
        }
        const nda: ChallengeTerm = {
            agreeabilityType: 'Electronically-agreeable',
            id: 'nda',
            text: 'Test',
            title: 'Topcoder Member Non-Disclosure Agreement v3.0',
        }
        const onComplete = jest.fn()
        mockGetSubmitterTermsDetails.mockResolvedValueOnce([standardTerms])
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [standardTerms, nda],
            isValidating: false,
        }

        render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={onComplete}
                open
                terms={[standardTerms, nda]}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))
        const frame = await screen.findByTitle('Topcoder Member Non-Disclosure Agreement v3.0')
        await waitFor(() => expect(addEventListener)
            .toHaveBeenCalledWith('message', expect.any(Function)))

        fireEvent(window, new MessageEvent('message', {
            data: { event: 'signing_complete', type: 'DocuSign' },
            origin: 'https://www.topcoder-dev.com',
            source: (frame as HTMLIFrameElement).contentWindow,
        }))

        await waitFor(() => expect(screen.getByRole('dialog', { name: 'Standard Terms 2026' }))
            .toBeInTheDocument())
        expect(mockMutateTermsCache)
            .toHaveBeenLastCalledWith(expect.any(Array), [standardTerms], { revalidate: false })
        expect(mockAgreeToTerms)
            .toHaveBeenCalledTimes(1)
        expect(onComplete)
            .not.toHaveBeenCalled()
    })

    it('stays on the active term and does not register when agreement fails', async () => {
        const standardTerms: ChallengeTerm = {
            agreeabilityType: 'Electronically-agreeable',
            id: 'standard-terms',
            text: '<p>Standard terms body</p>',
            title: 'Standard Terms 2026',
        }
        const nda: ChallengeTerm = {
            agreeabilityType: 'Electronically-agreeable',
            id: 'nda',
            text: '<p>NDA body</p>',
            title: 'Topcoder Member Non-Disclosure Agreement v3.0',
        }
        const onComplete = jest.fn()
        mockAgreeToTerms.mockRejectedValueOnce(new Error('Terms API unavailable'))
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [standardTerms, nda],
            isValidating: false,
        }

        render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={onComplete}
                open
                terms={[standardTerms, nda]}
            />,
        )
        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Terms API unavailable')
        expect(screen.getByRole('dialog', { name: 'Standard Terms 2026' }))
            .toBeInTheDocument()
        expect(screen.queryByText('NDA body'))
            .not.toBeInTheDocument()
        expect(onComplete)
            .not.toHaveBeenCalled()
    })

    it('advances when authoritative refresh confirms an ambiguous agreement succeeded', async () => {
        const standardTerms: ChallengeTerm = {
            agreeabilityType: 'Electronically-agreeable',
            id: 'standard-terms',
            text: '<p>Standard terms body</p>',
            title: 'Standard Terms 2026',
        }
        const nda: ChallengeTerm = {
            agreeabilityType: 'Electronically-agreeable',
            id: 'nda',
            text: '<p>NDA body</p>',
            title: 'NDA',
        }
        mockAgreeToTerms.mockRejectedValueOnce(new Error('Response lost after save'))
        mockGetSubmitterTermsDetails.mockResolvedValueOnce([nda])
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [standardTerms, nda],
            isValidating: false,
        }
        const onComplete = jest.fn()

        render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={onComplete}
                open
                terms={[standardTerms, nda]}
            />,
        )
        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))

        expect(await screen.findByRole('dialog', { name: 'NDA' }))
            .toBeInTheDocument()
        expect(mockGetSubmitterTermsDetails)
            .toHaveBeenCalledWith([standardTerms, nda])
        expect(mockMutateTermsCache)
            .toHaveBeenNthCalledWith(
                1,
                ['opportunities:challenge-terms', 'register', 'anonymous', 'standard-terms:|nda:'],
                [nda],
                { revalidate: false },
            )
        expect(mockMutateTermsCache)
            .toHaveBeenNthCalledWith(
                2,
                ['opportunities:challenge-terms', 'register', 'anonymous', 'standard-terms:|nda:'],
                expect.any(Function),
                { revalidate: false },
            )
        expect(screen.queryByRole('alert'))
            .not.toBeInTheDocument()
        expect(await screen.findByTitle('NDA'))
            .toHaveAttribute('src', 'https://docusign.example/recipient')
        expect(onComplete)
            .not.toHaveBeenCalled()
    })

    it('keeps final cache removal authoritative without registering when closed and reopened', async () => {
        const standardTerms: ChallengeTerm = {
            agreeabilityType: 'Electronically-agreeable',
            id: 'standard-terms',
            text: '<p>Standard terms body</p>',
            title: 'Standard Terms 2026',
        }
        const nda: ChallengeTerm = {
            agreeabilityType: 'Electronically-agreeable',
            id: 'nda',
            text: '<p>NDA body</p>',
            title: 'Additional Challenge Terms',
        }
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [standardTerms, nda],
            isValidating: false,
            mutate: jest.fn(),
        }
        mockMutateTermsCache.mockImplementation(async (_key, update) => {
            const current = mockSWRResponse.data
            const data = typeof update === 'function' ? update(current) : update
            mockSWRResponse = { ...mockSWRResponse, data }
            return data
        })
        const props = {
            mode: 'register' as const,
            onClose: jest.fn(),
            onComplete: jest.fn(),
            terms: [standardTerms, nda],
        }
        const view = render(<ChallengeTermsModal {...props} open />)

        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))
        await waitFor(() => expect(screen.getByRole('dialog', {
            name: 'Additional Challenge Terms',
        }))
            .toBeInTheDocument())
        let resolveAgreement: (() => void) | undefined
        mockAgreeToTerms.mockReturnValueOnce(new Promise<void>(resolve => {
            resolveAgreement = resolve
        }))
        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))
        fireEvent.click(screen.getByRole('button', { name: 'Close modal' }))
        expect(props.onClose)
            .toHaveBeenCalledTimes(1)
        view.rerender(<ChallengeTermsModal {...props} open={false} />)
        expect(props.onComplete)
            .not.toHaveBeenCalled()
        view.rerender(<ChallengeTermsModal {...props} open />)
        expect(screen.getByRole('dialog', {
            name: 'Additional Challenge Terms',
        }))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Agreeing…' }))
            .toBeDisabled()
        await act(async () => resolveAgreement?.())
        await waitFor(() => expect(mockMutateTermsCache)
            .toHaveBeenCalledTimes(2))

        expect(props.onComplete)
            .not.toHaveBeenCalled()
        expect(await screen.findByRole('dialog', { name: 'Important Reminder' }))
            .toBeInTheDocument()
        expect(screen.queryByText('Standard terms body'))
            .not.toBeInTheDocument()
        expect(screen.queryByText('NDA body'))
            .not.toBeInTheDocument()
    })

    it('evicts only the captured registration cache after switching mode and member', async () => {
        const standardTerms: ChallengeTerm = {
            agreeabilityType: 'Electronically-agreeable',
            id: 'standard-terms',
            roleId: 'submitter-role',
            text: '<p>Standard terms body</p>',
            title: 'Standard Terms 2026',
        }
        const passiveTerm: ChallengeTerm = {
            id: 'nda',
            roleId: 'viewer-role',
            text: '<p>Passive NDA body</p>',
            title: 'Passive terms reference',
        }
        const registrationKey = [
            'opportunities:challenge-terms',
            'register',
            '123',
            'standard-terms:submitter-role',
        ]
        const passiveKey = [
            'opportunities:challenge-terms',
            'view',
            '456',
            'nda:viewer-role',
        ]
        const cachedTerms = new Map<string, ChallengeTerm[]>([
            [JSON.stringify(registrationKey), [standardTerms]],
            [JSON.stringify(passiveKey), [passiveTerm]],
        ])
        mockMutateTermsCache.mockImplementation(async (key, update) => {
            const serializedKey = JSON.stringify(key)
            const current = cachedTerms.get(serializedKey)
            const data = typeof update === 'function' ? update(current) : update
            cachedTerms.set(serializedKey, data)
            return data
        })
        let resolveAgreement: (() => void) | undefined
        mockAgreeToTerms.mockReturnValueOnce(new Promise<void>(resolve => {
            resolveAgreement = resolve
        }))
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [standardTerms],
            isValidating: false,
        }
        const onComplete = jest.fn()
        const view = render(
            <ChallengeTermsModal
                memberId='123'
                mode='register'
                onClose={jest.fn()}
                onComplete={onComplete}
                open
                terms={[standardTerms]}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))
        fireEvent.click(screen.getByRole('button', { name: 'Close modal' }))
        mockSWRResponse = { ...mockSWRResponse, data: [passiveTerm] }
        view.rerender(
            <ChallengeTermsModal
                memberId='456'
                mode='view'
                onClose={jest.fn()}
                onComplete={onComplete}
                open
                terms={[passiveTerm]}
            />,
        )
        await act(async () => resolveAgreement?.())

        await waitFor(() => expect(mockMutateTermsCache)
            .toHaveBeenCalledWith(registrationKey, expect.any(Function), { revalidate: false }))
        expect(mockMutateTermsCache.mock.calls.some(call => JSON.stringify(call[0]) === JSON.stringify(passiveKey)))
            .toBe(false)
        expect(cachedTerms.get(JSON.stringify(registrationKey)))
            .toEqual([])
        expect(cachedTerms.get(JSON.stringify(passiveKey)))
            .toEqual([passiveTerm])
        expect(screen.getByText('Passive NDA body'))
            .toBeInTheDocument()
        expect(onComplete)
            .not.toHaveBeenCalled()
    })

    it('does not skip the next term when the SWR pending list shrinks', async () => {
        const terms: ChallengeTerm[] = [
            {
                agreeabilityType: 'Electronically-agreeable',
                id: 'standard-terms',
                text: '<p>Standard body</p>',
                title: 'Standard Terms',
            },
            {
                agreeabilityType: 'Electronically-agreeable',
                id: 'nda',
                text: '<p>NDA body</p>',
                title: 'Additional Rules',
            },
            {
                agreeabilityType: 'Electronically-agreeable',
                id: 'challenge-rules',
                text: '<p>Rules body</p>',
                title: 'Challenge Rules',
            },
        ]
        mockSWRResponse = {
            ...mockSWRResponse,
            data: terms,
            isValidating: false,
        }
        const props = {
            mode: 'register' as const,
            onClose: jest.fn(),
            onComplete: jest.fn(),
            open: true,
            terms,
        }
        const view = render(<ChallengeTermsModal {...props} />)
        const firstScrollContainer = screen.getByText('Standard body')
            .closest('article')?.parentElement

        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))
        await waitFor(() => expect(screen.getByRole('dialog', { name: 'Additional Rules' }))
            .toBeInTheDocument())
        const secondScrollContainer = screen.getByText('NDA body')
            .closest('article')?.parentElement
        expect(secondScrollContainer)
            .not.toBe(firstScrollContainer)
        mockSWRResponse = { ...mockSWRResponse, data: terms.slice(1) }
        view.rerender(<ChallengeTermsModal {...props} />)

        expect(screen.getByRole('dialog', { name: 'Additional Rules' }))
            .toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))
        await waitFor(() => expect(screen.getByRole('dialog', { name: 'Challenge Rules' }))
            .toBeInTheDocument())
        expect(mockAgreeToTerms)
            .toHaveBeenNthCalledWith(2, [terms[1]])
        expect(props.onComplete)
            .not.toHaveBeenCalled()
    })

    it('scopes registration details by member and Submitter role', () => {
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [],
            isValidating: false,
        }
        const props = {
            mode: 'register' as const,
            onClose: jest.fn(),
            onComplete: jest.fn(),
            open: true,
            terms: [{ id: 'standard-terms', roleId: 'submitter-role-a' }],
        }
        const view = render(<ChallengeTermsModal {...props} memberId='123' />)

        expect(mockUseSWR.mock.calls.at(-1)?.[0])
            .toEqual([
                'opportunities:challenge-terms',
                'register',
                '123',
                'standard-terms:submitter-role-a',
            ])

        view.rerender(
            <ChallengeTermsModal
                {...props}
                memberId='456'
                terms={[{ id: 'standard-terms', roleId: 'submitter-role-b' }]}
            />,
        )

        expect(mockUseSWR.mock.calls.at(-1)?.[0])
            .toEqual([
                'opportunities:challenge-terms',
                'register',
                '456',
                'standard-terms:submitter-role-b',
            ])
    })

    it('prefers an API DocuSign template and suppresses ordinary agreement controls', async () => {
        const externalNda: ChallengeTerm = {
            agreeabilityType: 'DocuSign-template',
            docusignTemplateId: 'nda-template',
            id: 'nda',
            text: '<p>NDA body</p>',
            title: 'Topcoder Member Non-Disclosure Agreement v3.0',
        }
        const onComplete = jest.fn()
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [externalNda],
            isValidating: false,
        }

        render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={onComplete}
                open
                terms={[externalNda]}
            />,
        )

        expect(await screen.findByTitle('Topcoder Member Non-Disclosure Agreement v3.0'))
            .toHaveAttribute('src', 'https://docusign.example/recipient')
        expect(mockGetDocuSignUrl)
            .toHaveBeenCalledWith(
                'nda-template',
                'https://www.topcoder-dev.com/community-app-assets/iframe-break',
            )
        expect(screen.queryByRole('button', { name: 'I agree' }))
            .not.toBeInTheDocument()
        expect(screen.queryByText('NDA body'))
            .not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Close' }))
            .toBeInTheDocument()
        expect(mockAgreeToTerms)
            .not.toHaveBeenCalled()
        expect(onComplete)
            .not.toHaveBeenCalled()
    })

    it('reuses the active recipient view when SWR replaces a term with an equivalent object', async () => {
        const nda: ChallengeTerm = {
            agreeabilityType: 'DocuSign-template',
            docusignTemplateId: 'nda-template',
            id: 'nda',
            title: 'Topcoder Member Non-Disclosure Agreement v3.0',
        }
        const props = {
            mode: 'register' as const,
            onClose: jest.fn(),
            onComplete: jest.fn(),
            open: true,
            terms: [nda],
        }
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [nda],
            isValidating: false,
        }
        const view = render(<ChallengeTermsModal {...props} />)

        expect(await screen.findByTitle(nda.title as string))
            .toHaveAttribute('src', 'https://docusign.example/recipient')
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [{ ...nda }],
        }
        view.rerender(<ChallengeTermsModal {...props} />)
        await act(async () => Promise.resolve())

        expect(mockGetDocuSignUrl)
            .toHaveBeenCalledTimes(1)
        expect(screen.getByTitle(nda.title as string))
            .toHaveAttribute('src', 'https://docusign.example/recipient')
    })

    it('does not render a previous single-use URL while advancing between DocuSign terms', async () => {
        const addEventListener = jest.spyOn(window, 'addEventListener')
        const firstNda: ChallengeTerm = {
            agreeabilityType: 'DocuSign-template',
            docusignTemplateId: 'first-template',
            id: 'first-nda',
            title: 'First NDA',
        }
        const secondNda: ChallengeTerm = {
            agreeabilityType: 'DocuSign-template',
            docusignTemplateId: 'second-template',
            id: 'second-nda',
            title: 'Second NDA',
        }
        mockGetDocuSignUrl
            .mockResolvedValueOnce('https://docusign.example/first-recipient')
            .mockImplementationOnce(() => new Promise(() => {
                // Keep the successor request pending to inspect its loading state.
            }))
        mockGetSubmitterTermsDetails.mockResolvedValueOnce([secondNda])
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [firstNda, secondNda],
            isValidating: false,
        }

        render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={jest.fn()}
                open
                terms={[firstNda, secondNda]}
            />,
        )

        const frame = await screen.findByTitle('First NDA')
        await waitFor(() => expect(addEventListener)
            .toHaveBeenCalledWith('message', expect.any(Function)))
        fireEvent(window, new MessageEvent('message', {
            data: { event: 'signing_complete', type: 'DocuSign' },
            origin: 'https://www.topcoder-dev.com',
            source: (frame as HTMLIFrameElement).contentWindow,
        }))

        await waitFor(() => expect(screen.getByRole('dialog', { name: 'Second NDA' }))
            .toBeInTheDocument())
        expect(mockGetDocuSignUrl)
            .toHaveBeenCalledTimes(2)
        expect(document.querySelector('iframe[src="https://docusign.example/first-recipient"]'))
            .toBeNull()
        expect(screen.queryByTitle('Second NDA'))
            .not.toBeInTheDocument()
        expect(screen.getByText('Loading DocuSign agreement…'))
            .toBeInTheDocument()
    })

    it('embeds the configured NDA in passive review without registering after completion', async () => {
        const addEventListener = jest.spyOn(window, 'addEventListener')
        const nda: ChallengeTerm = {
            agreeabilityType: 'Electronically-agreeable',
            id: 'nda',
            text: 'Test',
            title: 'Topcoder Member Non-Disclosure Agreement v3.0',
        }
        const onClose = jest.fn()
        const onComplete = jest.fn()
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [nda],
            isValidating: false,
        }

        render(
            <ChallengeTermsModal
                mode='view'
                onClose={onClose}
                onComplete={onComplete}
                open
                terms={[nda]}
            />,
        )

        const frame = await screen.findByTitle('Topcoder Member Non-Disclosure Agreement v3.0')
        await waitFor(() => expect(addEventListener)
            .toHaveBeenCalledWith('message', expect.any(Function)))
        expect(screen.queryByText('Test'))
            .not.toBeInTheDocument()
        fireEvent(window, new MessageEvent('message', {
            data: { event: 'viewing_complete', type: 'DocuSign' },
            origin: 'https://www.topcoder-dev.com',
            source: (frame as HTMLIFrameElement).contentWindow,
        }))

        await waitFor(() => expect(onClose)
            .toHaveBeenCalledTimes(1))
        expect(mockSWRResponse.mutate)
            .toHaveBeenCalledTimes(1)
        expect(mockGetSubmitterTermsDetails)
            .not.toHaveBeenCalled()
        expect(onComplete)
            .not.toHaveBeenCalled()
    })

    it('bounds a passive DocuSign refresh that never settles', async () => {
        const addEventListener = jest.spyOn(window, 'addEventListener')
        const nda: ChallengeTerm = {
            id: 'nda',
            title: 'NDA',
        }
        const onClose = jest.fn()
        const onComplete = jest.fn()
        const mutate = jest.fn(() => new Promise(() => {
            // Intentionally remains pending until the confirmation deadline.
        }))
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [nda],
            isValidating: false,
            mutate,
        }

        render(
            <ChallengeTermsModal
                mode='view'
                onClose={onClose}
                onComplete={onComplete}
                open
                terms={[nda]}
            />,
        )

        const frame = await screen.findByTitle('NDA')
        await waitFor(() => expect(addEventListener)
            .toHaveBeenCalledWith('message', expect.any(Function)))
        jest.useFakeTimers()
        fireEvent(window, new MessageEvent('message', {
            data: { event: 'viewing_complete', type: 'DocuSign' },
            origin: 'https://www.topcoder-dev.com',
            source: (frame as HTMLIFrameElement).contentWindow,
        }))
        await act(async () => Promise.resolve())

        expect(screen.getByText('Confirming your signature…'))
            .toBeInTheDocument()
        await act(async () => {
            jest.advanceTimersByTime(91000)
            await Promise.resolve()
            await Promise.resolve()
        })

        expect(screen.getByRole('alert'))
            .toHaveTextContent('couldn’t refresh this DocuSign agreement within 91 seconds')
        expect(screen.getByRole('button', { name: 'Check again' }))
            .toBeEnabled()
        expect(mutate)
            .toHaveBeenCalledTimes(1)
        expect(mockGetDocuSignUrl)
            .toHaveBeenCalledTimes(1)
        expect(onClose)
            .not.toHaveBeenCalled()
        expect(onComplete)
            .not.toHaveBeenCalled()
    })

    it('ignores untrusted DocuSign callback messages and closes on trusted cancellation', async () => {
        const addEventListener = jest.spyOn(window, 'addEventListener')
        const nda: ChallengeTerm = {
            id: 'nda',
            title: 'NDA',
        }
        const onClose = jest.fn()
        const onComplete = jest.fn()
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [nda],
            isValidating: false,
        }

        render(
            <ChallengeTermsModal
                mode='register'
                onClose={onClose}
                onComplete={onComplete}
                open
                terms={[nda]}
            />,
        )

        const frame = await screen.findByTitle('NDA')
        await waitFor(() => expect(addEventListener)
            .toHaveBeenCalledWith('message', expect.any(Function)))
        fireEvent(window, new MessageEvent('message', {
            data: { event: 'signing_complete', type: 'DocuSign' },
            origin: 'https://attacker.example',
            source: (frame as HTMLIFrameElement).contentWindow,
        }))
        expect(mockGetSubmitterTermsDetails)
            .not.toHaveBeenCalled()
        expect(onComplete)
            .not.toHaveBeenCalled()

        fireEvent(window, new MessageEvent('message', {
            data: { event: 'cancel', type: 'DocuSign' },
            origin: 'https://www.topcoder-dev.com',
            source: (frame as HTMLIFrameElement).contentWindow,
        }))
        expect(onClose)
            .toHaveBeenCalledTimes(1)
        expect(onComplete)
            .not.toHaveBeenCalled()
    })

    it('keeps polling past 20 seconds before completing DocuSign registration', async () => {
        const addEventListener = jest.spyOn(window, 'addEventListener')
        const nda: ChallengeTerm = {
            id: 'nda',
            title: 'NDA',
        }
        const onComplete = jest.fn()
            .mockResolvedValue(undefined)
        mockGetSubmitterTermsDetails
            .mockResolvedValueOnce([nda])
            .mockResolvedValueOnce([nda])
            .mockResolvedValueOnce([nda])
            .mockResolvedValueOnce([nda])
            .mockResolvedValueOnce([nda])
            .mockResolvedValueOnce([])
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [nda],
            isValidating: false,
        }
        const view = render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={onComplete}
                open
                terms={[nda]}
            />,
        )
        const frame = await screen.findByTitle('NDA')
        await waitFor(() => expect(addEventListener)
            .toHaveBeenCalledWith('message', expect.any(Function)))
        jest.useFakeTimers()

        fireEvent(window, new MessageEvent('message', {
            data: { event: 'signing_complete', type: 'DocuSign' },
            origin: 'https://www.topcoder-dev.com',
            source: (frame as HTMLIFrameElement).contentWindow,
        }))
        await act(async () => Promise.resolve())
        expect(mockGetSubmitterTermsDetails)
            .toHaveBeenCalledTimes(1)
        expect(onComplete)
            .not.toHaveBeenCalled()

        const retryDelays = [2000, 3000, 5000, 8000, 13000]

        for (let retry = 0; retry < retryDelays.length; retry += 1) {
            // Each completed read schedules the next backoff interval.
            // eslint-disable-next-line no-await-in-loop
            await act(async () => {
                jest.advanceTimersByTime(retryDelays[retry])
                await Promise.resolve()
            })
        }

        expect(mockGetSubmitterTermsDetails)
            .toHaveBeenCalledTimes(6)
        expect(mockGetSubmitterTermsDetails)
            .toHaveBeenLastCalledWith([nda], expect.objectContaining({
                fresh: true,
                signal: expect.objectContaining({ aborted: false }),
                timeoutMs: 10000,
            }))
        expect(onComplete)
            .toHaveBeenCalledTimes(1)
        expect(mockAgreeToTerms)
            .not.toHaveBeenCalled()

        jest.useRealTimers()
        view.unmount()
    })

    it('retries a timed-out Terms status request before completing DocuSign registration', async () => {
        const addEventListener = jest.spyOn(window, 'addEventListener')
        const nda: ChallengeTerm = {
            id: 'nda',
            title: 'NDA',
        }
        const onComplete = jest.fn()
            .mockResolvedValue(undefined)
        mockGetSubmitterTermsDetails
            .mockRejectedValueOnce(Object.assign(new Error('Terms status request timed out'), {
                code: 'ECONNABORTED',
            }))
            .mockResolvedValueOnce([])
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [nda],
            isValidating: false,
        }
        render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={onComplete}
                open
                terms={[nda]}
            />,
        )
        const frame = await screen.findByTitle('NDA')
        await waitFor(() => expect(addEventListener)
            .toHaveBeenCalledWith('message', expect.any(Function)))
        jest.useFakeTimers()

        fireEvent(window, new MessageEvent('message', {
            data: { event: 'signing_complete', type: 'DocuSign' },
            origin: 'https://www.topcoder-dev.com',
            source: (frame as HTMLIFrameElement).contentWindow,
        }))
        await act(async () => Promise.resolve())
        expect(onComplete)
            .not.toHaveBeenCalled()

        await act(async () => {
            jest.advanceTimersByTime(2000)
            await Promise.resolve()
        })

        expect(mockGetSubmitterTermsDetails)
            .toHaveBeenCalledTimes(2)
        expect(mockGetSubmitterTermsDetails)
            .toHaveBeenNthCalledWith(1, [nda], expect.objectContaining({
                fresh: true,
                signal: expect.objectContaining({ aborted: false }),
                timeoutMs: 10000,
            }))
        expect(mockGetSubmitterTermsDetails)
            .toHaveBeenNthCalledWith(2, [nda], expect.objectContaining({
                fresh: true,
                signal: expect.objectContaining({ aborted: false }),
                timeoutMs: 10000,
            }))
        expect(onComplete)
            .toHaveBeenCalledTimes(1)
        expect(mockAgreeToTerms)
            .not.toHaveBeenCalled()
    })

    it('keeps registration blocked when DocuSign persistence cannot be confirmed', async () => {
        const addEventListener = jest.spyOn(window, 'addEventListener')
        const nda: ChallengeTerm = {
            id: 'nda',
            title: 'NDA',
        }
        const onComplete = jest.fn()
        mockGetSubmitterTermsDetails.mockResolvedValue([nda])
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [nda],
            isValidating: false,
        }
        render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={onComplete}
                open
                terms={[nda]}
            />,
        )
        const frame = await screen.findByTitle('NDA')
        await waitFor(() => expect(addEventListener)
            .toHaveBeenCalledWith('message', expect.any(Function)))
        jest.useFakeTimers()
        fireEvent(window, new MessageEvent('message', {
            data: { event: 'signing_complete', type: 'DocuSign' },
            origin: 'https://www.topcoder-dev.com',
            source: (frame as HTMLIFrameElement).contentWindow,
        }))

        await act(async () => Promise.resolve())
        expect(mockGetSubmitterTermsDetails)
            .toHaveBeenCalledTimes(1)

        const retryDelays = [2000, 3000, 5000, 8000, 13000, 20000, 20000, 19000]
        for (let retry = 0; retry < retryDelays.length; retry += 1) {
            // Each status check schedules only the next retry.
            // eslint-disable-next-line no-await-in-loop
            await act(async () => {
                jest.advanceTimersByTime(retryDelays[retry])
                await Promise.resolve()
            })
        }

        expect(mockGetSubmitterTermsDetails)
            .toHaveBeenCalledTimes(9)
        expect(screen.getByRole('alert'))
            .toHaveTextContent('couldn’t confirm your DocuSign agreement within 91 seconds')
        expect(screen.getByRole('button', { name: 'Check again' }))
            .toBeInTheDocument()
        expect(mockAgreeToTerms)
            .not.toHaveBeenCalled()
        expect(onComplete)
            .not.toHaveBeenCalled()

        mockGetSubmitterTermsDetails.mockResolvedValueOnce([])
        fireEvent.click(screen.getByRole('button', { name: 'Check again' }))
        await act(async () => Promise.resolve())

        expect(onComplete)
            .toHaveBeenCalledTimes(1)
        expect(mockGetDocuSignUrl)
            .toHaveBeenCalledTimes(1)
        expect(mockGetSubmitterTermsDetails)
            .toHaveBeenCalledTimes(10)
        expect(mockAgreeToTerms)
            .not.toHaveBeenCalled()
    })

    it('bounds a status read that never settles and leaves confirmation retryable', async () => {
        const addEventListener = jest.spyOn(window, 'addEventListener')
        const nda: ChallengeTerm = {
            id: 'nda',
            title: 'NDA',
        }
        const onComplete = jest.fn()
        mockGetSubmitterTermsDetails.mockImplementation(() => new Promise(() => {
            // Intentionally remains pending until the confirmation deadline.
        }))
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [nda],
            isValidating: false,
        }
        render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={onComplete}
                open
                terms={[nda]}
            />,
        )
        const frame = await screen.findByTitle('NDA')
        await waitFor(() => expect(addEventListener)
            .toHaveBeenCalledWith('message', expect.any(Function)))
        jest.useFakeTimers()
        fireEvent(window, new MessageEvent('message', {
            data: { event: 'signing_complete', type: 'DocuSign' },
            origin: 'https://www.topcoder-dev.com',
            source: (frame as HTMLIFrameElement).contentWindow,
        }))
        await act(async () => Promise.resolve())

        const firstOptions = mockGetSubmitterTermsDetails.mock.calls[0][1] as {
            signal: AbortSignal
        }
        expect(screen.getByText('Confirming your signature…'))
            .toBeInTheDocument()
        expect(firstOptions.signal.aborted)
            .toBe(false)

        await act(async () => {
            jest.advanceTimersByTime(91000)
            await Promise.resolve()
            await Promise.resolve()
        })

        expect(firstOptions.signal.aborted)
            .toBe(true)
        expect(screen.getByRole('alert'))
            .toHaveTextContent('couldn’t confirm your DocuSign agreement within 91 seconds')
        expect(screen.getByRole('button', { name: 'Check again' }))
            .toBeEnabled()
        expect(mockAgreeToTerms)
            .not.toHaveBeenCalled()
        expect(onComplete)
            .not.toHaveBeenCalled()
    })

    it('aborts an in-flight DocuSign status read when the modal unmounts', async () => {
        const addEventListener = jest.spyOn(window, 'addEventListener')
        const nda: ChallengeTerm = {
            id: 'nda',
            title: 'NDA',
        }
        const onComplete = jest.fn()
        mockGetSubmitterTermsDetails.mockImplementation(() => new Promise(() => {
            // Intentionally remains pending so unmount must cancel the interaction.
        }))
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [nda],
            isValidating: false,
        }
        const view = render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={onComplete}
                open
                terms={[nda]}
            />,
        )
        const frame = await screen.findByTitle('NDA')
        await waitFor(() => expect(addEventListener)
            .toHaveBeenCalledWith('message', expect.any(Function)))
        jest.useFakeTimers()
        fireEvent(window, new MessageEvent('message', {
            data: { event: 'signing_complete', type: 'DocuSign' },
            origin: 'https://www.topcoder-dev.com',
            source: (frame as HTMLIFrameElement).contentWindow,
        }))
        await act(async () => {
            await Promise.resolve()
            await Promise.resolve()
        })
        expect(mockGetSubmitterTermsDetails)
            .toHaveBeenCalledTimes(1)
        const firstOptions = mockGetSubmitterTermsDetails.mock.calls[0][1] as {
            signal: AbortSignal
        }
        expect(firstOptions.signal.aborted)
            .toBe(false)

        view.unmount()
        await act(async () => {
            await Promise.resolve()
        })

        expect(firstOptions.signal.aborted)
            .toBe(true)
        expect(mockGetSubmitterTermsDetails)
            .toHaveBeenCalledTimes(1)
        expect(mockMutateTermsCache)
            .not.toHaveBeenCalled()
        expect(onComplete)
            .not.toHaveBeenCalled()
    })

    it('shows a retry when the Terms service cannot create the DocuSign view', async () => {
        const nda: ChallengeTerm = {
            id: 'nda',
            text: 'Test',
            title: 'NDA',
        }
        mockGetDocuSignUrl.mockRejectedValueOnce(new Error('Terms service unavailable'))
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [nda],
            isValidating: false,
        }

        render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={jest.fn()}
                open
                terms={[nda]}
            />,
        )

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Terms service unavailable')
        expect(screen.queryByText('Test'))
            .not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
        expect(await screen.findByTitle('NDA'))
            .toHaveAttribute('src', 'https://docusign.example/recipient')
        expect(mockGetDocuSignUrl)
            .toHaveBeenCalledTimes(2)
    })

    it('still opens a retryable dialog when accepted-term hydration fails', () => {
        mockSWRResponse = {
            ...mockSWRResponse,
            error: new Error('Terms unavailable'),
            isValidating: false,
        }

        render(
            <ChallengeTermsModal
                mode='register'
                onClose={jest.fn()}
                onComplete={jest.fn()}
                open
                terms={[{ id: 'standard-terms', title: 'Challenge Terms' }]}
            />,
        )

        expect(screen.getByRole('dialog', { name: 'Challenge Terms' }))
            .toBeInTheDocument()
        expect(screen.getByRole('alert'))
            .toHaveTextContent("We couldn't load the full challenge terms.")
    })

    it('normalizes Word-exported term styles while preserving semantic content and safe links', () => {
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [{
                id: 'standard-terms',
                text: `
                    <div class="WordSection1">
                        <h4 style="margin-top:30pt;margin-bottom:8pt;line-height:111%">
                            <span style="font-size:25.5pt;line-height:111%;color:#2a2a2a">
                                Acceptance of Terms and Conditions
                            </span>
                        </h4>
                        <p class="MsoNormal" style="margin-bottom:15pt;line-height:150%">
                            <span style="font-family:Roboto;font-size:12pt;line-height:150%">Welcome to </span>
                            <a href="https://www.topcoder.com">
                                <span style="font-family:Roboto;font-size:12pt;line-height:150%">topcoder.com</span>
                            </a>
                            <a href="javascript:alert('unsafe')">Unsafe link</a>
                        </p>
                    </div>
                `,
                title: 'Standard Terms 2026',
            }],
            isValidating: false,
        }

        render(
            <ChallengeTermsModal
                mode='view'
                onClose={jest.fn()}
                onComplete={jest.fn()}
                open
                terms={[{ id: 'standard-terms', title: 'Standard Terms 2026' }]}
            />,
        )

        const dialog = screen.getByRole('dialog', { name: 'Standard Terms 2026' })
        const heading = screen.getByRole('heading', {
            level: 4,
            name: 'Acceptance of Terms and Conditions',
        })
        const safeLink = screen.getByRole('link', { name: 'topcoder.com' })
        const unsafeLink = screen.getByText('Unsafe link')

        expect(dialog)
            .toBeInTheDocument()
        expect(heading.tagName)
            .toBe('H4')
        expect(screen.getByText('Welcome to'))
            .toBeInTheDocument()
        expect(safeLink)
            .toHaveAttribute('href', 'https://www.topcoder.com')
        expect(unsafeLink)
            .toHaveProperty('tagName', 'A')
        expect(unsafeLink)
            .not.toHaveAttribute('href')
        expect(dialog.querySelector('[style]'))
            .toBeNull()
    })
})
