/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'

import {
    completeEmailChangeAsync,
    getEmailChangeErrorMessage,
} from '~/apps/accounts/src/lib/services'

import ChangeEmailVerificationPage from './ChangeEmailVerificationPage'

let mockSearchParams = new URLSearchParams()

jest.mock('react-router-dom', () => ({
    useSearchParams: (): [URLSearchParams] => [mockSearchParams],
}))

jest.mock('~/apps/accounts/src/lib/services', () => ({
    completeEmailChangeAsync: jest.fn(),
    getEmailChangeErrorMessage: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    ContentLayout: (props: PropsWithChildren): JSX.Element => (
        <main>{props.children}</main>
    ),
    LinkButton: (props: { label: string, to: string }): JSX.Element => (
        <a href={props.to}>{props.label}</a>
    ),
    LoadingSpinner: (): JSX.Element => <span>Loading</span>,
    PageTitle: (props: PropsWithChildren): JSX.Element => (
        <h1>{props.children}</h1>
    ),
}), { virtual: true })

const mockedCompleteEmailChange = completeEmailChangeAsync as jest.MockedFunction<
    typeof completeEmailChangeAsync
>
const mockedGetErrorMessage = getEmailChangeErrorMessage as jest.MockedFunction<
    typeof getEmailChangeErrorMessage
>

describe('ChangeEmailVerificationPage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockSearchParams = new URLSearchParams()
        mockedGetErrorMessage.mockReturnValue('Validation failed.')
    })

    it('forwards the validation code and reports the changed address', async () => {
        mockSearchParams = new URLSearchParams('code=signed%2Fcode')
        mockedCompleteEmailChange.mockResolvedValue({
            email: 'new@example.com',
        })

        render(<ChangeEmailVerificationPage />)

        await waitFor(() => expect(mockedCompleteEmailChange)
            .toHaveBeenCalledWith('signed/code'))
        expect(await screen.findByText('Email changed'))
            .toBeInTheDocument()
        expect(screen.getByText('new@example.com is now your primary email address.'))
            .toBeInTheDocument()
    })

    it('continues to accept validation tokens from legacy links', async () => {
        mockSearchParams = new URLSearchParams('token=legacy-token')
        mockedCompleteEmailChange.mockResolvedValue({
            email: 'new@example.com',
        })

        render(<ChangeEmailVerificationPage />)

        await waitFor(() => expect(mockedCompleteEmailChange)
            .toHaveBeenCalledWith('legacy-token'))
    })

    it('does not call identity API when the link has no code', () => {
        render(<ChangeEmailVerificationPage />)

        expect(screen.getByText('This email validation link is incomplete.'))
            .toBeInTheDocument()
        expect(mockedCompleteEmailChange)
            .not
            .toHaveBeenCalled()
    })
})
