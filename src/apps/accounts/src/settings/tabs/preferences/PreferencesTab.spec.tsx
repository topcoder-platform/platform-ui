/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'
import { EnvironmentConfig } from '~/config'

import PreferencesTab from './PreferencesTab'

jest.mock('~/config', () => ({
    EnvironmentConfig: { CONTACT_API_ENABLED: true, ENV: 'prod', TC_DOMAIN: 'topcoder.com' },
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    Button: (props: { label: string }): JSX.Element => <button type='button'>{props.label}</button>,
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

jest.mock('./MarketingPreferences', () => ({
    __esModule: true,
    default: (): JSX.Element => <section>Email preferences</section>,
}))

const config = EnvironmentConfig as { CONTACT_API_ENABLED: boolean }

describe('PreferencesTab', () => {
    it('shows member email preferences where the Contact API is enabled', () => {
        config.CONTACT_API_ENABLED = true
        render(<PreferencesTab />)

        expect(screen.queryByText('Email preferences'))
            .not.toBeNull()
        expect(screen.queryByText('Forum'))
            .not.toBeNull()
    })

    it('hides member email preferences but keeps the forum link where the Contact API is not deployed', () => {
        config.CONTACT_API_ENABLED = false
        render(<PreferencesTab />)

        expect(screen.queryByText('Email preferences'))
            .toBeNull()
        expect(screen.queryByText('Forum'))
            .not.toBeNull()
        expect(screen.queryByRole('button', { name: 'Go To Forum' }))
            .not.toBeNull()
    })
})
