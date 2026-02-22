import { WORK_MANAGER_ALLOWED_ROLES } from './access.config'

describe('WORK_MANAGER_ALLOWED_ROLES', () => {
    it('includes customer and manager roles while excluding basic member roles', () => {
        expect(WORK_MANAGER_ALLOWED_ROLES)
            .toEqual(expect.arrayContaining([
                'administrator',
                'copilot',
                'Project Manager',
                'Topcoder Customer',
                'Client Manager',
            ]))
        expect(WORK_MANAGER_ALLOWED_ROLES)
            .not
            .toContain('Topcoder User')
        expect(WORK_MANAGER_ALLOWED_ROLES)
            .not
            .toContain('Topcoder Member')
    })
})
