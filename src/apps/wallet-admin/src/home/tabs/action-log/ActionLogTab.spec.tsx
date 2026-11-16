/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports, unicorn/no-null */
import React from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import { fetchActionLog, getMemberContacts } from '../../../lib/services/wallet'
import { ActionLogEntry, MemberContact } from '../../../lib/models/ActionLogEntry'
import ActionLogTab from './ActionLogTab'

jest.mock('../../../lib/services/wallet', () => ({
    fetchActionLog: jest.fn(),
    getMemberContacts: jest.fn(),
}))

jest.mock('~/libs/ui', () => ({
    Button: (props: any) => (
        <button type='button' disabled={props.disabled} onClick={props.onClick}>{props.label}</button>
    ),
    LoadingCircles: () => <div>Loading...</div>,
}), {
    virtual: true,
})

const mockedFetch = fetchActionLog as jest.Mock
const mockedGetMemberContacts = getMemberContacts as jest.Mock

const entry: ActionLogEntry = {
    action: 'Modified payment status from ON_HOLD_ADMIN to OWED',
    actionedAt: '2026-11-10T09:30:00.000Z',
    actionType: 'STATUS_CHANGE',
    adminUserId: '88774634',
    auditId: '6f0e2a51-3d3e-4f0f-9a8e-0c1c9b6f1b11',
    category: 'TASK_PAYMENT',
    datePaid: null,
    externalId: '30376875',
    note: 'Approved by the copilot',
    paymentId: 'c8b7d1e2-1111-4a4a-9c9c-222233334444',
    paymentStatus: 'OWED',
    releaseDate: '2026-11-25T09:30:00.000Z',
    title: 'Task - Fix wallet layout',
    totalAmount: '250.00',
    winnerId: '500021412',
    winningId: 'w-1',
    winningsType: 'PAYMENT',
}

const otherEntry: ActionLogEntry = {
    ...entry,
    action: 'Modified payment amount from 100 to 150.00',
    actionType: 'AMOUNT_CHANGE',
    adminUserId: '40011111',
    auditId: 'a2',
    note: null,
    title: 'Copilot payment',
    winnerId: '40022222',
    winningId: 'w-2',
}

const members: MemberContact[] = [
    {
        email: 'wallet.admin@topcoder.com',
        firstName: 'Wallet',
        handle: 'wallet_admin',
        lastName: 'Admin',
        userId: 88774634,
    },
    { handle: 'sreekarReddy07', userId: 500021412 },
    {
        email: 'other.admin@topcoder.com',
        firstName: 'Other',
        handle: 'other_admin',
        lastName: 'Admin',
        userId: 40011111,
    },
    { handle: 'copilotMember', userId: 40022222 },
]

describe('ActionLogTab', () => {
    beforeEach(() => {
        mockedFetch.mockReset()
        mockedGetMemberContacts.mockReset()
        mockedGetMemberContacts.mockResolvedValue(new Map(members.map(member => [String(member.userId), member])))
    })

    it('loads the last 3 months by default and lists the actions', async () => {
        mockedFetch.mockResolvedValueOnce([entry])

        const { container }: { container: HTMLElement } = render(<ActionLogTab />)

        expect(await screen.findByText('wallet_admin'))
            .toBeTruthy()
        expect(mockedFetch)
            .toHaveBeenCalledWith(90)
        expect(screen.getByRole('heading', { name: 'Action Log' }))
            .toBeTruthy()
        expect(screen.getByText('Wallet Admin'))
            .toBeTruthy()
        expect(screen.getByText('wallet.admin@topcoder.com'))
            .toBeTruthy()
        expect(screen.getByText('Status'))
            .toBeTruthy()
        expect(screen.getByText(entry.action))
            .toBeTruthy()
        expect(screen.getByText('Note: Approved by the copilot'))
            .toBeTruthy()
        expect(screen.getByText('sreekarReddy07'))
            .toBeTruthy()
        expect(screen.getByText('$250.00'))
            .toBeTruthy()
        expect(container.textContent)
            .toContain('1 action on 1 payment')
    })

    it('looks up the admins and members of the listed actions', async () => {
        mockedFetch.mockResolvedValueOnce([entry, otherEntry])

        render(<ActionLogTab />)
        await screen.findByText('wallet_admin')

        expect(mockedGetMemberContacts)
            .toHaveBeenCalledWith(['88774634', '40011111', '500021412', '40022222'])
    })

    it('shows user IDs when the member lookup fails', async () => {
        mockedFetch.mockResolvedValueOnce([entry])
        mockedGetMemberContacts.mockRejectedValueOnce(new Error('boom'))

        render(<ActionLogTab />)

        expect(await screen.findByText('88774634'))
            .toBeTruthy()
        expect(screen.getByText('500021412'))
            .toBeTruthy()
        expect(screen.queryByText('Failed to load the action log. Please try again.'))
            .toBeNull()
    })

    it('skips the member lookup when there are no actions', async () => {
        mockedFetch.mockResolvedValueOnce([])

        render(<ActionLogTab />)
        await screen.findByText('No manual payment actions found for this period.')

        expect(mockedGetMemberContacts)
            .not.toHaveBeenCalled()
    })

    it('filters the actions by the search text', async () => {
        mockedFetch.mockResolvedValueOnce([entry, otherEntry])

        const { container }: { container: HTMLElement } = render(<ActionLogTab />)
        await screen.findByText('wallet_admin')

        fireEvent.change(screen.getByLabelText('Search actions'), { target: { value: 'OTHER.admin' } })

        expect(screen.queryByText('wallet_admin'))
            .toBeNull()
        expect(screen.getByText('other_admin'))
            .toBeTruthy()
        expect(container.textContent)
            .toContain('1 action on 1 payment')

        fireEvent.change(screen.getByLabelText('Search actions'), { target: { value: 'nobody' } })

        expect(screen.getByText('No actions match your search.'))
            .toBeTruthy()
    })

    it('reloads with the selected period', async () => {
        mockedFetch.mockResolvedValue([])

        render(<ActionLogTab />)
        await screen.findByText('No manual payment actions found for this period.')

        fireEvent.click(screen.getByText('Last 7 days'))

        await waitFor(() => expect(mockedFetch)
            .toHaveBeenLastCalledWith(7))
    })

    it('shows an error when loading fails', async () => {
        mockedFetch.mockRejectedValueOnce(new Error('boom'))

        render(<ActionLogTab />)

        expect(await screen.findByText('Failed to load the action log. Please try again.'))
            .toBeTruthy()
    })
})
