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
    getChallengeTermDocuSignUrl: jest.fn(),
    getChallengeTermsDetails: jest.fn(),
}))

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

    it('persists Standard Terms and NDA separately before completing registration', async () => {
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
            .mockResolvedValue(undefined)
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
        expect(screen.queryByText('NDA body'))
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
        expect(screen.getByText('NDA body'))
            .toBeInTheDocument()
        expect(screen.queryByText('Standard terms body'))
            .not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'I agree' }))

        await waitFor(() => expect(onComplete)
            .toHaveBeenCalledTimes(1))
        expect(mockAgreeToTerms)
            .toHaveBeenNthCalledWith(2, [nda])
        expect(mockAgreeToTerms.mock.invocationCallOrder[1])
            .toBeLessThan(onComplete.mock.invocationCallOrder[0])
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
            title: 'Topcoder Member Non-Disclosure Agreement v3.0',
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
            name: 'Topcoder Member Non-Disclosure Agreement v3.0',
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
            name: 'Topcoder Member Non-Disclosure Agreement v3.0',
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
            title: 'NDA reference',
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
                title: 'NDA',
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
        await waitFor(() => expect(screen.getByRole('dialog', { name: 'NDA' }))
            .toBeInTheDocument())
        const secondScrollContainer = screen.getByText('NDA body')
            .closest('article')?.parentElement
        expect(secondScrollContainer)
            .not.toBe(firstScrollContainer)
        mockSWRResponse = { ...mockSWRResponse, data: terms.slice(1) }
        view.rerender(<ChallengeTermsModal {...props} />)

        expect(screen.getByRole('dialog', { name: 'NDA' }))
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

    it('fails closed on the active external agreement', () => {
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

        expect(screen.getByRole('button', { name: 'I agree' }))
            .toBeDisabled()
        expect(screen.getByRole('button', { name: 'Complete with DocuSign' }))
            .toBeInTheDocument()
        expect(screen.getByRole('alert'))
            .toHaveTextContent('Complete this external agreement before registering.')
        expect(mockAgreeToTerms)
            .not.toHaveBeenCalled()
        expect(onComplete)
            .not.toHaveBeenCalled()
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
