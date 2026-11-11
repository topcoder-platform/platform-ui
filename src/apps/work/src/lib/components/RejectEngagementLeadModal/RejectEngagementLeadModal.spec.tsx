/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { RejectEngagementLeadModal } from './RejectEngagementLeadModal'

jest.mock('~/libs/ui', () => ({
    Button: (
        props: {
            disabled?: boolean
            label: string
            onClick: () => void
        },
    ): JSX.Element => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
}), { virtual: true })

describe('RejectEngagementLeadModal', () => {
    it('does not reject until a reason is entered', async () => {
        const onConfirm = jest.fn()
        render(<RejectEngagementLeadModal leadId='lead-1' onCancel={jest.fn()} onConfirm={onConfirm} />)

        const reject = screen.getByRole('button', { name: 'Mark Lost' })
        expect(reject)
            .toBeDisabled()

        await userEvent.type(screen.getByLabelText('Rejection reason'), '   ')
        expect(reject)
            .toBeDisabled()
    })

    it('rejects with the trimmed reason', async () => {
        const onConfirm = jest.fn()
        render(<RejectEngagementLeadModal leadId='lead-1' onCancel={jest.fn()} onConfirm={onConfirm} />)

        await userEvent.type(screen.getByLabelText('Rejection reason'), '  Customer chose another vendor.  ')
        await userEvent.click(screen.getByRole('button', { name: 'Mark Lost' }))

        expect(onConfirm)
            .toHaveBeenCalledWith('Customer chose another vendor.')
    })

    it('cancels without rejecting', async () => {
        const onCancel = jest.fn()
        const onConfirm = jest.fn()
        render(<RejectEngagementLeadModal leadId='lead-1' onCancel={onCancel} onConfirm={onConfirm} />)

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(onCancel)
            .toHaveBeenCalled()
        expect(onConfirm)
            .not
            .toHaveBeenCalled()
    })
})
