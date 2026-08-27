/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { WALLET_ADMIN_ALLOWED_ROLES } from './config/access.config'
import {
    roleErrorRoute,
    roleErrorRouteId,
    walletAdminRoutes,
} from './wallet-admin.routes'

jest.mock('~/config', () => ({
    AppSubdomain: { walletAdmin: 'wallet-admin' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
    ToolTitle: { walletAdmin: 'Wallet Admin' },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    lazyLoad: () => (): JSX.Element => <div />,
}), { virtual: true })

describe('Wallet Admin application routes', () => {
    it('requires a payment role and sends everyone else to the access-denied page', () => {
        const [root] = walletAdminRoutes

        expect(root.authRequired)
            .toBe(true)
        expect(root.rolesRequired)
            .toEqual([...WALLET_ADMIN_ALLOWED_ROLES])
        expect(root.roleErrorRoute)
            .toBe(roleErrorRoute)
        expect(root.children?.some(route => route.route === roleErrorRouteId))
            .toBe(true)
    })
})
