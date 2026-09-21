/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type { PlatformRoute } from '~/libs/core'

interface OpportunitiesRoutesModule {
    legacyOpportunityRoutes: ReadonlyArray<PlatformRoute>
    opportunitiesRoutes: ReadonlyArray<PlatformRoute>
    rootRoute: string
    topgearRoutes: ReadonlyArray<PlatformRoute>
}

/**
 * Loads the routes module against a specific host subdomain.
 *
 * @param subdomain simulated first hostname label.
 * @returns freshly evaluated routes module.
 * @throws Does not throw.
 */
function loadRoutes(subdomain: string): OpportunitiesRoutesModule {
    let routes: OpportunitiesRoutesModule | undefined
    jest.isolateModules(() => {
        jest.doMock('~/config', () => ({
            AppSubdomain: { opportunities: 'opportunities', topgear: 'topgear' },
            EnvironmentConfig: { SUBDOMAIN: subdomain },
            ToolTitle: { opportunities: 'Opportunities' },
        }), { virtual: true })
        jest.doMock('~/libs/core', () => ({
            lazyLoad: () => (): JSX.Element => <div />,
        }), { virtual: true })
        // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
        routes = require('./opportunities.routes') as OpportunitiesRoutesModule
    })
    return routes as OpportunitiesRoutesModule
}

describe('Opportunities application routes', () => {
    afterEach(() => {
        jest.resetModules()
    })

    it('sends the TopGear host root to the Opportunities listing and keeps legacy challenge aliases', () => {
        const routes = loadRoutes('topgear')

        expect(routes.rootRoute)
            .toBe('/opportunities')
        expect(routes.topgearRoutes)
            .toHaveLength(1)
        expect(routes.topgearRoutes[0].route)
            .toBe('')
        // The isolated module registry loads its own react-router instance, so
        // compare the redirect element by name rather than by reference.
        expect((routes.topgearRoutes[0].element.type as { name?: string }).name)
            .toBe('Navigate')
        expect(routes.topgearRoutes[0].element.props)
            .toEqual({ replace: true, to: '/opportunities' })
        expect(routes.legacyOpportunityRoutes.map(route => route.route))
            .toEqual(expect.arrayContaining(['/challenges', '/challenges/:challengeId']))
    })

    it('leaves the platform home page alone on other hosts', () => {
        expect(loadRoutes('platform-ui').topgearRoutes)
            .toEqual([])
        expect(loadRoutes('opportunities').topgearRoutes)
            .toEqual([])
    })
})
