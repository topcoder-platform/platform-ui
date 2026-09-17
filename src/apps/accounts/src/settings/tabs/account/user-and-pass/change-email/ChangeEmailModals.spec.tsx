/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import type { PropsWithChildren, ReactNode } from 'react'

import ChangeEmailModal from './ChangeEmailModal'
import ChangeEmailOtpModal from './ChangeEmailOtpModal'

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: PropsWithChildren<{
        closeOnOverlayClick?: boolean
        onClose: () => void
        open: boolean
        size?: string
        title?: ReactNode
    }>): JSX.Element => (props.open ? (
        <div
            data-testid='modal-container'
            onClick={() => {
                if (props.closeOnOverlayClick !== false) {
                    props.onClose()
                }
            }}
        >
            <div className={`modal-${props.size ?? 'md'}`} data-testid='modal'>
                {props.title}
                <button data-testid='close-button' type='button' onClick={props.onClose}>
                    Close
                </button>
                {props.children}
            </div>
        </div>
    ) : <></>),
    Button: (props: {
        disabled?: boolean
        label: ReactNode
        onClick?: () => void
    }): JSX.Element => (
        <button
            disabled={props.disabled}
            type='button'
            onClick={props.onClick}
        >
            {props.label}
        </button>
    ),
    InputText: (props: {
        disabled?: boolean
        label: string
        placeholder?: string
        value?: string
    }): JSX.Element => (
        <label>
            {props.label}
            <input
                disabled={props.disabled}
                placeholder={props.placeholder}
                value={props.value ?? ''}
                onChange={jest.fn()}
            />
        </label>
    ),
    LoadingCircles: (): JSX.Element => <span>Verifying</span>,
    LoadingSpinner: (): JSX.Element => <span>Submitting</span>,
}), { virtual: true })

describe('change email modals', () => {
    it('uses the large modal width for the change email form', async () => {
        render(
            <ChangeEmailModal
                currentEmail='member@example.com'
                isOpen
                isSubmitting={false}
                onClose={jest.fn()}
                onSubmit={jest.fn()}
            />,
        )

        expect(await screen.findByTestId('modal'))
            .toHaveClass('modal-lg')
    })

    it('keeps the OTP modal open after a backdrop click', async () => {
        const onClose = jest.fn()

        render(
            <ChangeEmailOtpModal
                email='member@example.com'
                isOpen
                isResending={false}
                isVerifying={false}
                onClose={onClose}
                onResend={jest.fn()}
                onVerify={jest.fn()}
            />,
        )

        fireEvent.click(await screen.findByTestId('modal-container'))

        expect(onClose)
            .not
            .toHaveBeenCalled()
        expect(screen.getByText('CHECK YOUR EMAIL FOR A CODE'))
            .toBeInTheDocument()

        fireEvent.click(screen.getByTestId('close-button'))
        expect(onClose)
            .toHaveBeenCalledTimes(1)
    })
})
