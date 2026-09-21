/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { UserRole } from '~/libs/core'

import { analyticsRoutes } from './analytics-app.routes'

jest.mock('~/config', () => ({
    AppSubdomain: { analytics: 'analytics' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
    ToolTitle: { analytics: 'Analytics' },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    lazyLoad: () => (): JSX.Element => <div />,
    Rewrite: (): JSX.Element => <div />,
    UserRole: { analytics: 'analytics' },
}), { virtual: true })

describe('Analytics application routes', () => {
    it('protects the dedicated host and every child with the analytics role', () => {
        const [root] = analyticsRoutes

        expect(root.authRequired)
            .toBe(true)
        expect(root.domain)
            .toBe('analytics')
        expect(root.rolesRequired)
            .toEqual([UserRole.analytics])
        root.children?.forEach(child => {
            expect(child.authRequired)
                .toBe(true)
            expect(child.rolesRequired)
                .toEqual([UserRole.analytics])
        })
    })

    it('registers the default redirect plus campaign and general tabs', () => {
        const children = analyticsRoutes[0].children

        expect(children?.map(route => route.route))
            .toEqual(['', 'campaigns', 'general'])
        expect(children?.[0].element?.props.to)
            .toBe('campaigns')
    })
})
