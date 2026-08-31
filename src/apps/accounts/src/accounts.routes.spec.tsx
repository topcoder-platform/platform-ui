/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { accountsRoutes } from './accounts.routes'

jest.mock('~/config', () => ({
    AppSubdomain: { accounts: 'account-settings' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
    ToolTitle: { accounts: 'Account Settings' },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    lazyLoad: () => (): JSX.Element => <div />,
}), { virtual: true })

describe('Account Settings routes', () => {
    it('protects settings while allowing validation links to work logged out', () => {
        const [root] = accountsRoutes
        const settingsRoute = root.children?.find(route => route.route === '')
        const validationRoute = root.children?.find(route => route.route === 'changeEmail')

        expect(root.authRequired)
            .toBeUndefined()
        expect(settingsRoute?.authRequired)
            .toBe(true)
        expect(validationRoute?.authRequired)
            .toBeUndefined()
    })
})
