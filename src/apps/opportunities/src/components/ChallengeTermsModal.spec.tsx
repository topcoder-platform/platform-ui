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
})
