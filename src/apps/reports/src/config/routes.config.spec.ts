/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    buildReportsPath,
    dashboardDetailRoute,
    dashboardRouteSlugs,
    dashboardsPageRouteId,
    getReportsRootRoute,
} from './routes.config'

jest.mock('~/config', () => ({
    AppSubdomain: { reports: 'reports' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
}), { virtual: true })

describe('Reports route configuration', () => {
    it('builds absolute dashboard paths on the combined Platform UI host', () => {
        expect(buildReportsPath(dashboardsPageRouteId))
            .toBe('/reports/dashboards')
        expect(buildReportsPath(dashboardsPageRouteId, dashboardRouteSlugs.newSignups))
            .toBe('/reports/dashboards/new-signups')
        expect(buildReportsPath(dashboardsPageRouteId, 'slug with spaces'))
            .toBe('/reports/dashboards/slug%20with%20spaces')
    })

    it('resolves combined and dedicated Reports roots', () => {
        expect(getReportsRootRoute('platform-ui'))
            .toBe('/reports')
        expect(getReportsRootRoute('reports'))
            .toBe('')
    })

    it('exposes stable dashboard route IDs and slugs', () => {
        expect(dashboardDetailRoute)
            .toBe('dashboards/:dashboardSlug')
        expect(dashboardRouteSlugs)
            .toEqual({
                challengeParticipation: 'challenge-participation',
                membersPaid: 'members-paid',
                newSignups: 'new-signups',
            })
    })
})
