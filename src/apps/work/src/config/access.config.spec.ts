import { WORK_MANAGER_ALLOWED_ROLES } from './access.config'

describe('WORK_MANAGER_ALLOWED_ROLES', () => {
    it('matches the explicit list of roles allowed to access Work', () => {
        expect(WORK_MANAGER_ALLOWED_ROLES)
            .toEqual([
                'copilot',
                'Topcoder Customer',
                'administrator',
                'Project Manager',
                'Client Manager',
                'Talent Manager',
            ])
        expect(WORK_MANAGER_ALLOWED_ROLES)
            .not
            .toContain('Topcoder User')
        expect(WORK_MANAGER_ALLOWED_ROLES)
            .not
            .toContain('Topcoder Member')
    })
})
