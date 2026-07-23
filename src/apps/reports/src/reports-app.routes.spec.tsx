/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    dashboardDetailRoute,
    dashboardsPageRouteId,
} from './config/routes.config'
import { reportsRoutes } from './reports-app.routes'

jest.mock('~/config', () => ({
    AppSubdomain: { reports: 'reports' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
    ToolTitle: { reports: 'Reports' },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    lazyLoad: () => (): JSX.Element => <div />,
    Rewrite: (): JSX.Element => <div />,
    UserRole: {
        administrator: 'administrator',
        talentManager: 'talentManager',
    },
}), { virtual: true })

describe('Reports application routes', () => {
    it('registers the Dashboards landing page and slug detail page', () => {
        const childPaths = reportsRoutes[0].children?.map(route => route.route)

        expect(childPaths)
            .toContain(dashboardsPageRouteId)
        expect(childPaths)
            .toContain(dashboardDetailRoute)
    })
})
