import { dashboardDefinitions } from './dashboard.config'

describe('dashboard chart definitions', () => {
    it('uses bottom-timeline column charts for every report', () => {
        expect(dashboardDefinitions['new-signups'].chartType)
            .toBe('column')
        expect(dashboardDefinitions['members-paid'].chartType)
            .toBe('column')
        expect(dashboardDefinitions['challenge-participation'].chartType)
            .toBe('column')
    })

    it('keeps the signup and payment series stacked and participation grouped', () => {
        expect(dashboardDefinitions['new-signups'].stacked)
            .toBe(true)
        expect(dashboardDefinitions['members-paid'].stacked)
            .toBe(true)
        expect(dashboardDefinitions['challenge-participation'].stacked)
            .toBe(false)
    })
})
