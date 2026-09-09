/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { xhrGetAsync, xhrPutAsync } from '~/libs/core'

import MarketingPreferences from './MarketingPreferences'

jest.mock('~/config', () => ({
    EnvironmentConfig: { CONTACT_API: 'https://api.example.test/v6/contact' },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrGetAsync: jest.fn(), xhrPutAsync: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: (props: { disabled?: boolean, label: string, onClick?: () => void }): JSX.Element => (
        <button type='button' disabled={props.disabled} onClick={props.onClick}>{props.label}</button>
    ),
}), { virtual: true })

const mockedGet = xhrGetAsync as jest.Mock
const mockedPut = xhrPutAsync as jest.Mock
const preferences = {
    memberId: '123',
    subscriptions: [
        {
            active: true,
            description: 'Community news',
            name: 'Community Newsletter',
            source: 'Member preference',
            subscribed: true,
            subscriptionTypeId: 'newsletter',
        },
        {
            active: true,
            description: 'Match announcements',
            name: 'Marathon Match',
            source: 'No recorded preference',
            subscribed: false,
            subscriptionTypeId: 'marathon',
        },
    ],
    suppressed: false,
}

describe('member marketing preferences', () => {
    beforeEach(() => {
        mockedGet.mockReset()
        mockedPut.mockReset()
    })

    it('loads actual choices and explicitly saves an empty selection without a target member ID', async () => {
        mockedGet.mockResolvedValue(preferences)
        mockedPut.mockResolvedValue({
            ...preferences,
            subscriptions: preferences.subscriptions.map(item => ({ ...item, subscribed: false })),
        })
        render(<MarketingPreferences />)
        const newsletter = await screen.findByRole('checkbox', { name: /Community Newsletter/ })
        expect(newsletter)
            .toBeChecked()
        expect(screen.getByRole('checkbox', { name: /Marathon Match/ }))
            .not.toBeChecked()
        expect(mockedPut)
            .not.toHaveBeenCalled()
        fireEvent.click(newsletter)
        fireEvent.click(screen.getByRole('button', { name: 'Save email preferences' }))
        await screen.findByText('Your email preferences are saved.')
        expect(mockedPut)
            .toHaveBeenCalledWith('https://api.example.test/v6/contact/me/subscriptions', { subscriptionTypeIds: [] })
    })

    it('keeps choices unavailable after load failure and permits an explicit retry', async () => {
        mockedGet.mockRejectedValueOnce(new Error('Unavailable'))
            .mockResolvedValueOnce(preferences)
        render(<MarketingPreferences />)
        await screen.findByRole('alert')
        expect(screen.queryByRole('checkbox'))
            .not.toBeInTheDocument()
        expect(mockedPut)
            .not.toHaveBeenCalled()
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
        await screen.findByRole('checkbox', { name: /Community Newsletter/ })
    })

    it('retains unsaved choices on save failure and displays real suppression without clearing it', async () => {
        mockedGet.mockResolvedValue({ ...preferences, suppressed: true })
        mockedPut.mockRejectedValue(new Error('Unavailable'))
        render(<MarketingPreferences />)
        const marathon = await screen.findByRole('checkbox', { name: /Marathon Match/ })
        expect(screen.getByText(/Delivery to your email address is paused/))
            .toBeInTheDocument()
        fireEvent.click(marathon)
        fireEvent.click(screen.getByRole('button', { name: 'Save email preferences' }))
        await screen.findByRole('alert')
        expect(marathon)
            .toBeChecked()
        await waitFor(() => expect(screen.getByRole('button', { name: 'Save email preferences' }))
            .toBeEnabled())
        expect(screen.queryByText('Your email preferences are saved.'))
            .not.toBeInTheDocument()
    })
})
