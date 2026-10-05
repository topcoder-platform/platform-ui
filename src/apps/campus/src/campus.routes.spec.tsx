import { campusRoutes } from './campus.routes'

jest.mock('~/config', () => ({
    AppSubdomain: {
        campus: 'campus',
    },
    EnvironmentConfig: {
        SUBDOMAIN: 'campus',
    },
    ToolTitle: {
        campus: 'Campus',
    },
}), {
    virtual: true,
})

jest.mock('~/libs/core', () => ({
    lazyLoad: () => (): undefined => undefined,
}), {
    virtual: true,
})

describe('campus routes', () => {
    it('serves the campus homepage on the campus root', () => {
        const campusChildRoutes = campusRoutes[0].children || []
        const homeRoute = campusChildRoutes.find(route => route.route === '')

        expect(homeRoute?.id)
            .toBe('Campus Home')
    })

    it('serves the leaderboard for a group name', () => {
        const campusChildRoutes = campusRoutes[0].children || []

        expect(campusChildRoutes.find(route => route.route === ':groupName')?.id)
            .toBe('Campus Leaderboard')
    })
})
