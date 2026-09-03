/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { PropsWithChildren } from 'react'
import { render, screen } from '@testing-library/react'

import { ChallengeTerm } from '../models'

import { ChallengeTermsModal } from './ChallengeTermsModal'

interface MockSWRResponse {
    data?: ChallengeTerm[]
    error?: Error
    isValidating: boolean
    mutate: jest.Mock
}

let mockSWRResponse: MockSWRResponse

jest.mock('swr', () => ({
    __esModule: true,
    default: (): MockSWRResponse => mockSWRResponse,
}))

jest.mock('../services', () => ({
    getChallengeSubmitterTermsDetails: jest.fn(),
    getChallengeTermDocuSignUrl: jest.fn(),
    getChallengeTermsDetails: jest.fn(),
}))

jest.mock('~/libs/cms', () => ({
    getSafeCmsLink: (value: string): string => value,
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: PropsWithChildren<{
        open: boolean
        title: string
    }>): JSX.Element => (
        <>{props.open && <div aria-label={props.title} role='dialog'>{props.children}</div>}</>
    ),
    Button: (props: { label: string }): JSX.Element => <button type='button'>{props.label}</button>,
    LoadingSpinner: (): JSX.Element => <span>Loading</span>,
}), { virtual: true })

describe('ChallengeTermsModal', () => {
    beforeEach(() => {
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
            onAccept: jest.fn(),
            onClose: jest.fn(),
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

    it('does not flash stale hydrated terms while a new registration request is loading', () => {
        mockSWRResponse = {
            ...mockSWRResponse,
            data: [{ id: 'previous-terms', title: 'Challenge Terms' }],
            isValidating: true,
        }

        render(
            <ChallengeTermsModal
                mode='register'
                onAccept={jest.fn()}
                onClose={jest.fn()}
                open
                terms={[{ id: 'current-terms', title: 'Challenge Terms' }]}
            />,
        )

        expect(screen.queryByRole('dialog'))
            .not.toBeInTheDocument()
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
                onAccept={jest.fn()}
                onClose={jest.fn()}
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
                onAccept={jest.fn()}
                onClose={jest.fn()}
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
