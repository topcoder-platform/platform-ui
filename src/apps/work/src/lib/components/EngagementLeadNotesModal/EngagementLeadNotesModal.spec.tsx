/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import {
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { EngagementLead, EngagementLeadStatus, EngagementLeadType } from '../../models/EngagementLead.model'
import { addEngagementLeadNote } from '../../services/engagement-leads.service'

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
    addEngagementLeadNote: jest.fn(),
}))

jest.mock('../../utils', () => ({
    extractErrorMessage: (_err: unknown, fallback: string): string => fallback,
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))

describe('EngagementLeadNotesModal', () => {
    const mockAddNote = addEngagementLeadNote as jest.MockedFunction<typeof addEngagementLeadNote>
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
        mockAddNote.mockReset()
    })

    const earlierNote = {
        content: 'First call done.',
        createdAt: '2026-10-29T09:00:00.000Z',
        createdBy: 'tm-one',
        id: 'note-1',
    }
    const laterNote = {
        content: 'Customer wants banking experience.',
        createdAt: '2026-10-30T09:00:00.000Z',
        createdBy: 'tm-two',
        id: 'note-2',
    }

    it('lists existing notes oldest first with their creator, read-only', () => {
        render(
            <EngagementLeadNotesModal
                lead={{ ...baseLead, notes: [laterNote, earlierNote] }}
                onClose={jest.fn()}
                onSaved={jest.fn()}
            />,
        )

        const items = within(screen.getByRole('list', { name: 'Existing notes' }))
            .getAllByRole('listitem')
        expect(items)
            .toHaveLength(2)
        expect(items[0])
            .toHaveTextContent('First call done.')
        expect(items[0])
            .toHaveTextContent('by tm-one')
        expect(items[1])
            .toHaveTextContent('Customer wants banking experience.')
        expect(items[1])
            .toHaveTextContent('by tm-two')
        expect(within(items[0])
            .queryByRole('textbox'))
            .toBeNull()
        expect(screen.getByLabelText('New note'))
            .toHaveValue('')
        expect(screen.getByRole('button', { name: 'Add Note' }))
            .toBeDisabled()
    })

    it('adds a new note and returns the updated lead', async () => {
        const updatedLead = { ...baseLead, notes: [earlierNote, laterNote] }
        const onSaved = jest.fn()
        mockAddNote.mockResolvedValue(updatedLead)

        render(
            <EngagementLeadNotesModal
                lead={{ ...baseLead, notes: [earlierNote] }}
                onClose={jest.fn()}
                onSaved={onSaved}
            />,
        )

        await userEvent.type(screen.getByLabelText('New note'), '  Customer wants banking experience.  ')
        await userEvent.click(screen.getByRole('button', { name: 'Add Note' }))

        await waitFor(() => expect(onSaved)
            .toHaveBeenCalledWith(updatedLead))
        expect(mockAddNote)
            .toHaveBeenCalledWith('lead-1', 'Customer wants banking experience.')
    })

    it('says so when the lead has no notes yet', () => {
        render(<EngagementLeadNotesModal lead={baseLead} onClose={jest.fn()} onSaved={jest.fn()} />)

        expect(screen.getByText('No notes were added.'))
            .toBeInTheDocument()
    })

    it.each([
        EngagementLeadStatus.CONVERTED,
        EngagementLeadStatus.REJECTED,
    ])('adds notes to a %s lead', async status => {
        const lead = { ...baseLead, notes: [earlierNote], status }
        mockAddNote.mockResolvedValue(lead)

        render(
            <EngagementLeadNotesModal
                lead={lead}
                onClose={jest.fn()}
                onSaved={jest.fn()}
            />,
        )

        expect(screen.getByText('First call done.'))
            .toBeInTheDocument()

        await userEvent.type(screen.getByLabelText('New note'), 'Account asked to reopen.')
        await userEvent.click(screen.getByRole('button', { name: 'Add Note' }))

        await waitFor(() => expect(mockAddNote)
            .toHaveBeenCalledWith('lead-1', 'Account asked to reopen.'))
    })
})
