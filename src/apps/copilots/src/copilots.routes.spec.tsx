import { copilotsRoutes, getCopilotsAbsoluteRootRoute } from './copilots.routes'

jest.mock('~/config', () => ({
    AppSubdomain: { copilots: 'copilots' },
    EnvironmentConfig: { SUBDOMAIN: 'topcoder-dev', TC_DOMAIN: 'topcoder-dev.com' },
    ToolTitle: { copilots: 'Copilots' },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    lazyLoad: jest.fn(() => {
        const MockComponent = (): JSX.Element => <div />

        return MockComponent
    }),
    UserRole: {
        administrator: 'administrator',
        projectManager: 'projectManager',
    },
}), { virtual: true })

describe('copilotsRoutes', () => {
    it('keeps the public opportunity detail route accessible without parent role restrictions', () => {
        const [rootRoute] = copilotsRoutes
        const detailRoute = rootRoute.children?.find(route => route.id === 'CopilotOpportunityDetails')

        expect(rootRoute.route)
            .toBe('/copilots')
        expect(rootRoute.rolesRequired)
            .toBeUndefined()
        expect(detailRoute?.authRequired)
            .toBeUndefined()
        expect(detailRoute?.route)
            .toBe('/opportunity/:opportunityId')
    })

    it('targets the copilots subdomain for direct opens from Topcoder hosts', () => {
        expect(getCopilotsAbsoluteRootRoute(
            'https://topcoder-dev.com',
            'topcoder-dev',
            'topcoder-dev.com',
        ))
            .toBe('https://copilots.topcoder-dev.com')
        expect(getCopilotsAbsoluteRootRoute(
            'https://www.topcoder-dev.com',
            'www',
            'topcoder-dev.com',
        ))
            .toBe('https://copilots.topcoder-dev.com')
    })

    it('keeps current-origin routing on the copilots subdomain and localhost', () => {
        expect(getCopilotsAbsoluteRootRoute(
            'https://copilots.topcoder-dev.com',
            'copilots',
            'topcoder-dev.com',
        ))
            .toBe('https://copilots.topcoder-dev.com')
        expect(getCopilotsAbsoluteRootRoute(
            'http://localhost:3000',
            'localhost',
            'topcoder-dev.com',
        ))
            .toBe('http://localhost:3000/copilots')
    })
})
