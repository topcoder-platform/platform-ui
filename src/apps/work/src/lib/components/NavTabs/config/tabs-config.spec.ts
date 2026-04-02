import { getTabsConfig } from './tabs-config'

jest.mock('~/config', () => ({
    AppSubdomain: {
        work: 'work',
    },
    EnvironmentConfig: {
        SUBDOMAIN: 'work',
    },
}), {
    virtual: true,
})

jest.mock('../../../utils/permissions.utils', () => ({
    canViewAllEngagements: (userRoles: string[]) => (
        userRoles.includes('administrator') || userRoles.includes('talent manager')
    ),
}))

describe('getTabsConfig', () => {
    it('shows the engagements tab for talent managers on the common work page', () => {
        expect(getTabsConfig(['talent manager'], false)
            .map(tab => tab.id))
            .toContain('engagements')
    })

    it('keeps the engagements tab hidden for project managers without talent manager access', () => {
        expect(getTabsConfig(['project manager'], false)
            .map(tab => tab.id))
            .not
            .toContain('engagements')
    })
})
