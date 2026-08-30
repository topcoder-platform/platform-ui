/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    buildAnalyticsPath,
    getAnalyticsRootRoute,
} from './routes.config'

jest.mock('~/config', () => ({
    AppSubdomain: { analytics: 'analytics' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
}), { virtual: true })

describe('Analytics route configuration', () => {
    it('resolves combined and dedicated host roots', () => {
        expect(getAnalyticsRootRoute('platform-ui'))
            .toBe('/analytics')
        expect(getAnalyticsRootRoute('analytics'))
            .toBe('')
    })

    it('builds encoded absolute paths under the active root', () => {
        expect(buildAnalyticsPath('campaigns'))
            .toBe('/analytics/campaigns')
        expect(buildAnalyticsPath('campaigns', 'paid search'))
            .toBe('/analytics/campaigns/paid%20search')
    })
})
