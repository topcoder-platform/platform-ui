/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { UserRole } from '~/libs/core'

import { getStatusRootRoute } from './config/routes.config'
import { statusRoutes } from './status-app.routes'

jest.mock('~/config', () => ({
    AppSubdomain: { status: 'status' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
    ToolTitle: { status: 'Status' },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    lazyLoad: () => (): JSX.Element => <div />,
    Rewrite: (): JSX.Element => <div />,
    UserRole: { administrator: 'administrator' },
}), { virtual: true })

describe('Status application routes', () => {
    it('protects the root and every child with the exact administrator role', () => {
        const [root] = statusRoutes

        expect(root.authRequired)
            .toBe(true)
        expect(root.rolesRequired)
            .toEqual([UserRole.administrator])
        expect(root.children)
            .toHaveLength(7)
        root.children?.forEach(child => {
            expect(child.authRequired)
                .toBe(true)
            expect(child.rolesRequired)
                .toEqual([UserRole.administrator])
        })
    })

    it('registers the redirect, tabs, and routed API drill-downs', () => {
        const childPaths = statusRoutes[0].children?.map(route => route.route)

        expect(statusRoutes[0].children?.[0].element?.props.to)
            .toBe('ecs')
        expect(childPaths)
            .toEqual([
                '',
                'ecs',
                'api',
                'api/:serviceId',
                'api/:serviceId/endpoints/:endpointId',
                'sendgrid',
                'database',
            ])
    })

    it('resolves combined and dedicated host roots', () => {
        expect(getStatusRootRoute('platform-ui'))
            .toBe('/status')
        expect(getStatusRootRoute('status'))
            .toBe('')
    })
})
