/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { getSupportRootRoute } from './config/routes.config'
import { supportRoutes } from './support-app.routes'

jest.mock('~/config', () => ({
    AppSubdomain: { support: 'support' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
    ToolTitle: { support: 'Support' },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    lazyLoad: () => (): JSX.Element => <div />,
}), { virtual: true })

describe('Support application routes', () => {
    it('protects the root and children without excluding members by role', () => {
        const [root] = supportRoutes

        expect(root.authRequired)
            .toBe(true)
        expect(root.rolesRequired)
            .toBeUndefined()
        expect(root.children)
            .toHaveLength(3)
        root.children?.forEach(child => {
            expect(child.authRequired)
                .toBe(true)
            expect(child.rolesRequired)
                .toBeUndefined()
        })
    })

    it('registers open, closed, and detail paths', () => {
        expect(supportRoutes[0].children?.map(route => route.route))
            .toEqual([
                '',
                'closed',
                'tickets/:ticketId',
            ])
    })

    it('resolves combined and dedicated host roots case-insensitively', () => {
        expect(getSupportRootRoute('platform-ui'))
            .toBe('/support')
        expect(getSupportRootRoute('SUPPORT'))
            .toBe('')
    })
})
