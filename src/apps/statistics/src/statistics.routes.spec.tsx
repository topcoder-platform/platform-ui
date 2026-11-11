import { AppSubdomain, ToolTitle } from '~/config'

jest.mock('~/config', () => ({
    AppSubdomain: { statistics: 'statistics' },
    EnvironmentConfig: { SUBDOMAIN: 'www' },
    ToolTitle: { statistics: 'Statistics' },
}), { virtual: true })
jest.mock('~/libs/core', () => ({
    getRoutesContainer: () => <div />,
    lazyLoad: () => () => <div />,
}), { virtual: true })
jest.mock('react-router-dom', () => ({ Navigate: () => <div />, useLocation: () => ({}) }))

it.each(['www', 'topcoder-dev', 'topcoder', 'statistics', 'localhost'])(
    'registers public statistics and category routes for host %s', host => {
        jest.resetModules()
        jest.doMock('~/config', () => ({
            AppSubdomain,
            EnvironmentConfig: { SUBDOMAIN: host },
            ToolTitle,
        }), { virtual: true })
        // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
        const routes = require('./statistics.routes').statisticsRoutes
        expect(routes[0].route).toBe(host === 'statistics' ? '' : '/statistics')
        expect(routes[0].domain).toBe('statistics')
        expect(routes[0].authRequired).toBeUndefined()
        expect(routes[0].children[0].route).toBe('*')
        expect(routes[1].route).toBe('/community/statistics/*')
    },
)
