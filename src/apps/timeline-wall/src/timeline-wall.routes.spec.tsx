import { AppSubdomain, ToolTitle } from '~/config'

jest.mock('~/config', () => ({
    AppSubdomain: { timelineWall: 'timeline' },
    EnvironmentConfig: { SUBDOMAIN: 'www' },
    ToolTitle: { timelineWall: 'Timeline Wall' },
}), { virtual: true })
jest.mock('~/libs/core', () => ({ lazyLoad: () => () => <div /> }), { virtual: true })
jest.mock('react-router-dom', () => ({ Navigate: () => <div />, useLocation: () => ({}) }))

it.each(['www', 'topcoder-dev', 'timeline', 'localhost'])('registers the public timeline for host %s', host => {
    jest.resetModules()
    jest.doMock('~/config', () => ({
        AppSubdomain,
        EnvironmentConfig: { SUBDOMAIN: host },
        ToolTitle,
    }), { virtual: true })
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const routes = require('./timeline-wall.routes').timelineWallRoutes

    expect(routes[0].route)
        .toBe(host === 'timeline' ? '' : '/timeline-wall')
    expect(routes[0].domain)
        .toBe('timeline')
    expect(routes[0].authRequired)
        .toBeUndefined()
    expect(routes[1].route)
        .toBe('/community/timeline-wall')
})
