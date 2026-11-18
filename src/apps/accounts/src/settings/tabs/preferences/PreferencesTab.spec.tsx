/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPutAsync } from '~/libs/core'

import PreferencesTab from './PreferencesTab'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        CONTACT_API: 'https://api.example.test/v6/contact',
        CONTACT_API_ENABLED: true,
        ENV: 'prod',
        TC_DOMAIN: 'topcoder.com',
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrGetAsync: jest.fn(), xhrPutAsync: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: (props: { label: string, onClick?: () => void }): JSX.Element => (
        <button type='button' onClick={props.onClick}>{props.label}</button>
    ),
}), { virtual: true })

jest.mock('../../../lib', () => ({
    ForumIcon: (): JSX.Element => <span />,
    SettingSection: (props: { actionElement: JSX.Element, title: string }): JSX.Element => (
        <div>
            <span>{props.title}</span>
            {props.actionElement}
        </div>
    ),
}))

const mockedGet = xhrGetAsync as jest.Mock

describe('PreferencesTab', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        EnvironmentConfig.CONTACT_API_ENABLED = true
        mockedGet.mockResolvedValue({ subscriptions: [], suppressed: false })
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('loads email preferences when the Contact API is enabled', async () => {
        render(<PreferencesTab />)

        expect(await screen.findByText('No email categories are available right now.'))
            .toBeInTheDocument()
        expect(xhrGetAsync)
            .toHaveBeenCalledWith('https://api.example.test/v6/contact/me/subscriptions')
        expect(screen.getByRole('button', { name: 'Go To Forum' }))
            .toBeInTheDocument()
    })

    it('makes no Contact API requests when disabled and keeps the Forum link working', () => {
        EnvironmentConfig.CONTACT_API_ENABLED = false
        const open = jest.spyOn(window, 'open')
            .mockImplementation(() => window)
        render(<PreferencesTab />)

        expect(screen.queryByRole('heading', { name: 'Email preferences' }))
            .not.toBeInTheDocument()
        expect(xhrGetAsync)
            .not.toHaveBeenCalled()
        expect(xhrPutAsync)
            .not.toHaveBeenCalled()
        fireEvent.click(screen.getByRole('button', { name: 'Go To Forum' }))
        expect(open)
            .toHaveBeenCalledWith('https://discussions.topcoder.com/profile/preferences', '_blank')
    })
})
