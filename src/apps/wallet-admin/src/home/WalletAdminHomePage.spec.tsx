/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { render, screen } from '@testing-library/react'

import type { UserProfile } from '~/libs/core'

import { WALLET_ADMIN_ACCESS_DENIED_MESSAGE } from '../pages/role-error/RoleErrorPage'
import WalletAdminHomePage from './WalletAdminHomePage'

const mockProfileContext = {
    initialized: true,
    profile: { roles: ['Topcoder User'] } as UserProfile,
}

jest.mock('~/libs/core', () => ({
    profileContext: {},
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    ContentLayout: (props: { children?: unknown }): JSX.Element => (
        <div>{props.children as JSX.Element}</div>
    ),
    LoadingSpinner: (): JSX.Element => <div />,
}), { virtual: true })

jest.mock('./page-layout', () => ({
    WalletAdminLayout: (): JSX.Element => <div>Wallet admin layout</div>,
}))

jest.mock('react', () => {
    const actual = jest.requireActual('react')

    return {
        ...actual,
        useContext: () => mockProfileContext,
    }
})

describe('WalletAdminHomePage', () => {
    beforeEach(() => {
        mockProfileContext.initialized = true
        mockProfileContext.profile = { roles: ['Topcoder User'] } as UserProfile
    })

    it('shows an access-denied message instead of search filters for members', () => {
        render(<WalletAdminHomePage />)

        expect(screen.getByText(WALLET_ADMIN_ACCESS_DENIED_MESSAGE))
            .toBeTruthy()
        expect(screen.queryByText('Wallet admin layout'))
            .toBeNull()
    })

    it('renders the admin layout for payment admins', () => {
        mockProfileContext.profile = { roles: ['Payment Admin'] } as UserProfile

        render(<WalletAdminHomePage />)

        expect(screen.getByText('Wallet admin layout'))
            .toBeTruthy()
        expect(screen.queryByText(WALLET_ADMIN_ACCESS_DENIED_MESSAGE))
            .toBeNull()
    })
})
