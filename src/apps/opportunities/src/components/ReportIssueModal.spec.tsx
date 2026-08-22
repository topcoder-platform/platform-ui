/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, react/jsx-no-bind */
import '@testing-library/jest-dom'
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { PropsWithChildren, ReactNode } from 'react'

import { createSupportTicket } from '~/apps/support/src/lib/services/support.service'

import { ReportIssueModal } from './ReportIssueModal'

jest.mock('react-toastify', () => ({
    toast: { success: jest.fn() },
}))

jest.mock('~/apps/support/src/lib/services/support.service', () => ({
    createSupportTicket: jest.fn(),
}), { virtual: true })

jest.mock('~/apps/support/src/lib/components/SupportMarkdownEditor', () => ({
    SupportMarkdownEditor: (props: {
        disabled?: boolean
        label: string
        onChange: (value: string) => void
        value: string
    }): JSX.Element => (
        <label>
            {props.label}
            <textarea
                disabled={props.disabled}
                onChange={event => props.onChange(event.target.value)}
                value={props.value}
            />
        </label>
    ),
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        BaseModal: (props: PropsWithChildren<{
            ariaLabelledby?: string
            buttons?: ReactNode
            open: boolean
            size?: string
            title?: ReactNode
        }>): JSX.Element => (props.open ? (
            <div aria-labelledby={props.ariaLabelledby} data-size={props.size} role='dialog'>
                {props.title}
                {props.children}
                {props.buttons}
            </div>
        ) : <></>),
        Button: (props: {
            disabled?: boolean
            label: ReactNode
            onClick: () => void
        }): JSX.Element => (
            <button disabled={props.disabled} onClick={props.onClick} type='button'>
                {props.label}
            </button>
        ),
        IconOutline: new Proxy({}, { get: () => Icon }),
    }
}, { virtual: true })

const mockedCreateSupportTicket = createSupportTicket as jest.Mock

describe('ReportIssueModal', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedCreateSupportTicket.mockResolvedValue({ id: 'ticket-id' })
    })

    it('keeps the approved Markdown-only flow and enables Send report for a description', async () => {
        render(<ReportIssueModal challengeId='challenge-id' onClose={jest.fn()} open />)

        expect(screen.getByRole('dialog', { name: 'Report an Issue' }))
            .toHaveAttribute('data-size', 'md')
        expect(screen.getByRole('heading', { name: 'Report an Issue' }))
            .toBeInTheDocument()
        expect(screen.queryByText('Subject'))
            .not.toBeInTheDocument()
        expect(screen.queryByText('Category'))
            .not.toBeInTheDocument()
        expect(screen.queryByText(/Attach Files/i))
            .not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Close report issue' }))
            .toBeInTheDocument()

        const submit = screen.getByRole('button', { name: 'Send report' })
        expect(submit)
            .toBeDisabled()

        fireEvent.change(screen.getByLabelText('Description'), {
            target: { value: '  The review page failed.  ' },
        })
        expect(submit)
            .toBeEnabled()
        fireEvent.click(submit)

        await waitFor(() => {
            expect(mockedCreateSupportTicket)
                .toHaveBeenCalledWith({
                    challengeId: 'challenge-id',
                    description: 'The review page failed.',
                })
        })
        expect(await screen.findByText('Thank you for reporting this issue.'))
            .toBeInTheDocument()
    })
})
