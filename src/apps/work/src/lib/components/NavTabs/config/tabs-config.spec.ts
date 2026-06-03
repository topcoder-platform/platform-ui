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

    it('shows the budget approvals tab for admin users', () => {
        expect(getTabsConfig(['administrator'], false)
            .map(tab => tab.id))
            .toContain('budget-approvals')
    })

    it('shows the budget approvals tab for manager users', () => {
        expect(getTabsConfig(['project manager'], false)
            .map(tab => tab.id))
            .toContain('budget-approvals')
    })

    it('keeps the budget approvals tab hidden for copilot-only users', () => {
        expect(getTabsConfig(['copilot'], false)
            .map(tab => tab.id))
            .not
            .toContain('budget-approvals')
    })
})
