/* eslint-disable import/no-extraneous-dependencies */
import { render, screen } from '@testing-library/react'

import RoleErrorPage, { WALLET_ADMIN_ACCESS_DENIED_MESSAGE } from './RoleErrorPage'

jest.mock('~/libs/ui', () => ({
    ContentLayout: (props: { children?: unknown }): JSX.Element => (
        <div>{props.children as JSX.Element}</div>
    ),
}), {
    virtual: true,
})

describe('RoleErrorPage', () => {
    it('tells members they cannot access Wallet Admin', () => {
        render(<RoleErrorPage />)

        expect(screen.getByText(WALLET_ADMIN_ACCESS_DENIED_MESSAGE))
            .toBeTruthy()
    })
})
