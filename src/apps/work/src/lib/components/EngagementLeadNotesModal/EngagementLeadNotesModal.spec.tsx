/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { EngagementLead, EngagementLeadStatus, EngagementLeadType } from '../../models/EngagementLead.model'
import { updateEngagementLeadNotes } from '../../services/engagement-leads.service'

import { EngagementLeadNotesModal } from './EngagementLeadNotesModal'

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

jest.mock('../../services/engagement-leads.service', () => ({
    updateEngagementLeadNotes: jest.fn(),
}))

jest.mock('../../utils', () => ({
    extractErrorMessage: (_err: unknown, fallback: string): string => fallback,
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))

describe('EngagementLeadNotesModal', () => {
    const mockUpdateNotes = updateEngagementLeadNotes as jest.MockedFunction<typeof updateEngagementLeadNotes>
    const baseLead: EngagementLead = {
        accountName: 'ABC Bank',
        createdAt: '2026-10-28T00:00:00.000Z',
        engagementDuration: '6 months',
        id: 'lead-1',
        jobDescription: 'Build the product.',
        leadType: EngagementLeadType.WIPRO_DIRECT,
        remoteWorkAccepted: true,
        requiredSkills: ['React'],
        resourcesRequired: 1,
        smu: 'AMR1',
        status: EngagementLeadStatus.SUBMITTED,
        timeZoneRequirement: 'IST',
        updatedAt: '2026-10-28T00:00:00.000Z',
        workEmail: 'jane.doe@customer.com',
        workingHoursPerDay: 8,
    }

    beforeEach(() => {
        mockUpdateNotes.mockReset()
    })

    it('saves the entered notes and returns the updated lead', async () => {
        const updatedLead = { ...baseLead, notes: 'Call back next week.' }
        const onSaved = jest.fn()
        mockUpdateNotes.mockResolvedValue(updatedLead)

        render(<EngagementLeadNotesModal lead={baseLead} onClose={jest.fn()} onSaved={onSaved} />)

        await userEvent.type(screen.getByLabelText('Notes'), 'Call back next week.')
        await userEvent.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => expect(onSaved)
            .toHaveBeenCalledWith(updatedLead))
        expect(mockUpdateNotes)
            .toHaveBeenCalledWith('lead-1', 'Call back next week.')
    })

    it('shows the saved notes when reopened', () => {
        render(
            <EngagementLeadNotesModal
                lead={{ ...baseLead, notes: 'Existing note' }}
                onClose={jest.fn()}
                onSaved={jest.fn()}
            />,
        )

        expect(screen.getByLabelText('Notes'))
            .toHaveValue('Existing note')
        expect(screen.getByRole('button', { name: 'Save' }))
            .toBeDisabled()
    })

    it('makes the notes read-only once the lead is converted', async () => {
        const onClose = jest.fn()

        render(
            <EngagementLeadNotesModal
                lead={{ ...baseLead, notes: 'Final note', status: EngagementLeadStatus.CONVERTED }}
                onClose={onClose}
                onSaved={jest.fn()}
            />,
        )

        expect(screen.getByLabelText('Notes'))
            .toHaveAttribute('readonly')
        expect(screen.queryByRole('button', { name: 'Save' }))
            .toBeNull()

        await userEvent.click(screen.getByRole('button', { name: 'Close' }))

        expect(onClose)
            .toHaveBeenCalled()
        expect(mockUpdateNotes)
            .not
            .toHaveBeenCalled()
    })
})
