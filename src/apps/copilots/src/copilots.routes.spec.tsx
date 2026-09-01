import { copilotsRoutes } from './copilots.routes'

jest.mock('~/config', () => ({
    AppSubdomain: { copilots: 'copilots' },
    EnvironmentConfig: { SUBDOMAIN: 'topcoder-dev' },
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
})
