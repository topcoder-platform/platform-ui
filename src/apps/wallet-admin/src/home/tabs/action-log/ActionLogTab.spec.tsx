/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind, unicorn/no-null */
import React from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import {
    fetchActionLog,
    fetchActionLogAdminIds,
    fetchPaymentActionRoleMemberIds,
    getMemberContacts,
} from '../../../lib/services/wallet'
import { ActionLogEntry, ActionLogFilters, MemberContact } from '../../../lib/models/ActionLogEntry'
import ActionLogTab from './ActionLogTab'

jest.mock('../../../lib/services/wallet', () => ({
    fetchActionLog: jest.fn(),
    fetchActionLogAdminIds: jest.fn(),
    fetchPaymentActionRoleMemberIds: jest.fn(),
    getMemberContacts: jest.fn(),
}))

// native controls in place of the wallet-admin filter bar
jest.mock('../../../lib/components/filter-bar/FilterBar', () => ({
    __esModule: true,
    default: (props: any) => (
        <div>
            {props.filters.map((filter: any) => {
                const value = props.selectedValueOverrides?.[filter.key]
                if (filter.type === 'date') {
                    return (
                        <input
                            key={filter.key}
                            type='date'
                            aria-label={filter.label}
                            value={value ?? ''}
                            onChange={(event: any) => props.onFilterChange(
                                filter.key,
                                event.target.value ? [event.target.value] : [],
                            )}
                        />
                    )
                }

                const isMulti = filter.type === 'multi_dropdown'
                return (
                    <select
                        key={filter.key}
                        aria-label={filter.label}
                        multiple={isMulti}
                        value={value}
                        onChange={(event: any) => props.onFilterChange(
                            filter.key,
                            Array.from(event.target.selectedOptions)
                                .map((option: any) => option.value),
                        )}
                    >
                        {filter.options.map((option: any) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                )
            })}
            <button type='button' disabled={!props.hasActiveFilters} onClick={props.onResetFilters}>
                Reset
            </button>
        </div>
    ),
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
const mockedFetchAdminIds = fetchActionLogAdminIds as jest.Mock
const mockedFetchRoleMemberIds = fetchPaymentActionRoleMemberIds as jest.Mock
const mockedGetMemberContacts = getMemberContacts as jest.Mock

function lastFilters(): ActionLogFilters {
    return mockedFetch.mock.calls[mockedFetch.mock.calls.length - 1][0]
}

function selectOptions(label: string, values: string[]): void {
    const select = screen.getByLabelText(label) as HTMLSelectElement
    Array.from(select.options)
        .forEach(option => {
            option.selected = values.includes(option.value)
        })
    fireEvent.change(select)
}

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
        jest.useFakeTimers({
            doNotFake: ['setTimeout', 'setInterval', 'nextTick', 'setImmediate'],
            now: new Date(2026, 10, 26, 15, 0),
        })
        mockedFetch.mockReset()
        mockedFetchAdminIds.mockReset()
        mockedFetchAdminIds.mockResolvedValue(['40011111'])
        mockedFetchRoleMemberIds.mockReset()
        mockedFetchRoleMemberIds.mockResolvedValue(['88774634', '40011111'])
        mockedGetMemberContacts.mockReset()
        mockedGetMemberContacts.mockResolvedValue(new Map(members.map(member => [String(member.userId), member])))
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('loads Topcoder payments of the last 90 days by default and lists the actions', async () => {
        mockedFetch.mockResolvedValueOnce([entry])

        const { container }: { container: HTMLElement } = render(<ActionLogTab />)

        expect(await screen.findByText('wallet_admin', { selector: 'span' }))
            .toBeTruthy()
        expect(mockedFetch)
            .toHaveBeenCalledWith({
                adminUserId: undefined,
                categories: [],
                dateFrom: new Date(2026, 7, 29),
                dateTo: new Date(2026, 10, 26, 23, 59, 59, 999),
                paymentSource: 'TOPCODER',
            })
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
        await screen.findByText('wallet_admin', { selector: 'span' })

        expect(mockedGetMemberContacts)
            .toHaveBeenCalledWith(['88774634', '40011111', '500021412', '40022222'])
    })

    it('lists the payment role members and past admins in the actioned by filter', async () => {
        mockedFetch.mockResolvedValue([])
        mockedFetchAdminIds.mockResolvedValue(['40011111', '99999999'])

        render(<ActionLogTab />)

        await waitFor(() => expect(screen.getByRole('option', { name: 'other_admin' }))
            .toBeTruthy())
        const labels = Array.from((screen.getByLabelText('Actioned By') as HTMLSelectElement).options)
            .map(option => option.textContent)
        expect(labels)
            .toEqual(['All', '99999999', 'other_admin', 'wallet_admin'])
        expect(mockedGetMemberContacts)
            .toHaveBeenCalledWith(['88774634', '40011111', '99999999'])
    })

    it('still lists the past admins when the role lookup fails', async () => {
        mockedFetch.mockResolvedValue([])
        mockedFetchRoleMemberIds.mockRejectedValue(new Error('forbidden'))

        render(<ActionLogTab />)

        await waitFor(() => expect(screen.getByRole('option', { name: 'other_admin' }))
            .toBeTruthy())
        expect(screen.queryByRole('option', { name: 'wallet_admin' }))
            .toBeNull()
    })

    it('shows user IDs when the member lookup fails', async () => {
        mockedFetch.mockResolvedValueOnce([entry])
        mockedFetchAdminIds.mockResolvedValue([])
        mockedFetchRoleMemberIds.mockResolvedValue([])
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
        mockedFetchAdminIds.mockResolvedValue([])
        mockedFetchRoleMemberIds.mockResolvedValue([])

        render(<ActionLogTab />)
        await screen.findByText('No manual payment actions match the selected filters.')

        expect(mockedGetMemberContacts)
            .not.toHaveBeenCalled()
    })

    it('filters the actions by the search text', async () => {
        mockedFetch.mockResolvedValueOnce([entry, otherEntry])

        const { container }: { container: HTMLElement } = render(<ActionLogTab />)
        await screen.findByText('wallet_admin', { selector: 'span' })

        fireEvent.change(screen.getByLabelText('Search actions'), { target: { value: 'OTHER.admin' } })

        expect(screen.queryByText('wallet_admin', { selector: 'span' }))
            .toBeNull()
        expect(screen.getByText('other_admin', { selector: 'span' }))
            .toBeTruthy()
        expect(container.textContent)
            .toContain('1 action on 1 payment')

        fireEvent.change(screen.getByLabelText('Search actions'), { target: { value: 'nobody' } })

        expect(screen.getByText('No actions match your search.'))
            .toBeTruthy()
    })

    it('reloads with the selected payment types and admin', async () => {
        mockedFetch.mockResolvedValue([])

        render(<ActionLogTab />)
        await waitFor(() => expect(screen.getByRole('option', { name: 'other_admin' }))
            .toBeTruthy())

        selectOptions('Payment Type', ['TASK_PAYMENT', 'ENGAGEMENT_PAYMENT'])
        await waitFor(() => expect(lastFilters().categories)
            .toEqual(['TASK_PAYMENT', 'ENGAGEMENT_PAYMENT']))

        selectOptions('Actioned By', ['40011111'])
        await waitFor(() => expect(lastFilters())
            .toEqual(expect.objectContaining({
                adminUserId: '40011111',
                categories: ['TASK_PAYMENT', 'ENGAGEMENT_PAYMENT'],
                paymentSource: 'TOPCODER',
            })))
    })

    it('only offers payment types for Topcoder payments', async () => {
        mockedFetch.mockResolvedValue([])

        render(<ActionLogTab />)
        await screen.findByText('No manual payment actions match the selected filters.')

        selectOptions('Payment Type', ['TASK_PAYMENT'])
        selectOptions('Payment Category', ['TAAS'])

        await waitFor(() => expect(lastFilters())
            .toEqual(expect.objectContaining({ categories: [], paymentSource: 'TAAS' })))
        expect(screen.queryByLabelText('Payment Type'))
            .toBeNull()

        selectOptions('Payment Category', ['TOPCODER'])

        expect((screen.getByLabelText('Payment Type') as HTMLSelectElement).selectedOptions)
            .toHaveLength(0)
    })

    it('reloads with the selected date range', async () => {
        mockedFetch.mockResolvedValue([])

        render(<ActionLogTab />)
        await screen.findByText('No manual payment actions match the selected filters.')

        fireEvent.change(screen.getByLabelText('Date from'), { target: { value: '2026-10-01' } })
        fireEvent.change(screen.getByLabelText('Date to'), { target: { value: '2026-10-31' } })

        await waitFor(() => expect(lastFilters())
            .toEqual(expect.objectContaining({
                dateFrom: new Date(2026, 9, 1),
                dateTo: new Date(2026, 9, 31, 23, 59, 59, 999),
            })))
    })

    // the default to date is today, 2026-11-26
    it.each([
        ['a range over 90 days', '2026-08-01', 'Select a date range of at most 90 days.'],
        ['a from date after the to date', '2026-11-27', 'The from date must be on or before the to date.'],
        ['a missing date', '', 'Select both a from and a to date.'],
    ])('does not load %s', async (_, dateFrom, message) => {
        mockedFetch.mockResolvedValue([])

        render(<ActionLogTab />)
        await screen.findByText('No manual payment actions match the selected filters.')

        fireEvent.change(screen.getByLabelText('Date from'), { target: { value: dateFrom } })

        expect(await screen.findByText(message))
            .toBeTruthy()
        expect(mockedFetch)
            .toHaveBeenCalledTimes(1)
    })

    it('accepts a range of exactly 90 days', async () => {
        mockedFetch.mockResolvedValue([])

        render(<ActionLogTab />)
        await screen.findByText('No manual payment actions match the selected filters.')

        fireEvent.change(screen.getByLabelText('Date from'), { target: { value: '2026-08-01' } })
        fireEvent.change(screen.getByLabelText('Date to'), { target: { value: '2026-10-29' } })

        await waitFor(() => expect(lastFilters())
            .toEqual(expect.objectContaining({
                dateFrom: new Date(2026, 7, 1),
                dateTo: new Date(2026, 9, 29, 23, 59, 59, 999),
            })))
    })

    it('resets the filters to the defaults', async () => {
        mockedFetch.mockResolvedValue([])

        render(<ActionLogTab />)
        await screen.findByText('No manual payment actions match the selected filters.')
        const defaults = lastFilters()

        expect((screen.getByText('Reset') as HTMLButtonElement).disabled)
            .toBe(true)

        selectOptions('Payment Category', ['TOPGEAR'])
        await waitFor(() => expect(lastFilters().paymentSource)
            .toBe('TOPGEAR'))

        fireEvent.click(screen.getByText('Reset'))

        await waitFor(() => expect(lastFilters())
            .toEqual(defaults))
    })

    it('shows an error when loading fails', async () => {
        mockedFetch.mockRejectedValueOnce(new Error('boom'))

        render(<ActionLogTab />)

        expect(await screen.findByText('Failed to load the action log. Please try again.'))
            .toBeTruthy()
    })
})
