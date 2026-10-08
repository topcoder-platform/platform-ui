/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { PlatformRoute } from '~/libs/core'

/** Loads route declarations for one simulated host.
 * @param subdomain Host label. @returns Fresh public forum route tree. @throws Module loading errors.
 */
function loadRoutes(subdomain: string): {
    forumsRoot: string
    forumsRoutes: ReadonlyArray<PlatformRoute>
    legacyForumsPath: string
} {
    jest.resetModules()
    jest.doMock('~/libs/core', () => ({ lazyLoad: () => () => <div /> }), { virtual: true })
    jest.doMock('~/config', () => ({
        AppSubdomain: { forums: 'forums' },
        EnvironmentConfig: { SUBDOMAIN: subdomain },
        ToolTitle: { forums: 'Forums' },
    }), { virtual: true })
    // eslint-disable-next-line global-require
    return require('./forums.routes')
}

describe('public forums routes', () => {
    it.each([['forums', ''], ['platform', '/forums']])('keeps all pages under the %s domain root', (host, root) => {
        const routes = loadRoutes(host)
        expect(routes.forumsRoot)
            .toBe(root)
        expect(routes.legacyForumsPath)
            .toBe(`${root}/legacy`)
        expect(routes.forumsRoutes)
            .toHaveLength(1)
        expect(routes.forumsRoutes[0].domain)
            .toBe('forums')
        expect(routes.forumsRoutes[0].authRequired).not.toBe(true)
        expect(routes.forumsRoutes[0].children?.map(child => child.route))
            .toEqual(['', 'legacy', 'category/:categoryId', 'thread/:threadId'])
        expect(routes.forumsRoutes[0].children?.some(child => child.authRequired))
            .toBe(false)
    })
})
