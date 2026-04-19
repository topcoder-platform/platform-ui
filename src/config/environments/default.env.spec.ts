import * as DefaultEnv from './default.env'

describe('default environment config', () => {
    it('points work-manager links to the new work app host in dev and qa', () => {
        expect(DefaultEnv.ADMIN.WORK_MANAGER_URL)
            .toBe('https://work.topcoder-dev.com')
    })
})
