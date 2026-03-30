import { decodeToken } from 'tc-auth-lib'

import type { Project } from '../models'

import {
    canCreateEngagement,
    checkCanManageProject,
    checkIsUserInvitedToProject,
    checkProjectMembership,
    getProjectMemberRole,
} from './permissions.utils'

jest.mock('tc-auth-lib', () => ({
    decodeToken: jest.fn(),
}))

jest.mock('~/config', () => ({
    EnvironmentConfig: new Proxy({}, {
        get: (): string => 'https://www.topcoder-dev.com',
    }),
}), { virtual: true })

jest.mock('../services/resources.service', () => ({
    fetchResourceRoles: jest.fn(),
    fetchResources: jest.fn(),
}))

const mockedDecodeToken = decodeToken as jest.MockedFunction<typeof decodeToken>

describe('permissions.utils project management helpers', () => {
    const managedProject: Project = {
        id: '123',
        members: [
            {
                role: 'manager',
                userId: 123,
            },
            {
                role: 'customer',
                userId: 456,
            },
        ],
        name: 'Managed project',
        status: 'active',
    }

    afterEach(() => {
        mockedDecodeToken.mockReset()
    })

    it('allows talent managers to create projects without a project context', () => {
        expect(checkCanManageProject(['Talent Manager'], '123'))
            .toBe(true)
    })

    it('requires project manager or copilot membership for talent manager edit access', () => {
        expect(checkCanManageProject(['Talent Manager'], '123', managedProject))
            .toBe(true)
        expect(checkCanManageProject(['Talent Manager'], '456', managedProject))
            .toBe(false)
    })

    it('does not expand project-manager creation access beyond the work-manager change', () => {
        expect(checkCanManageProject(['Project Manager'], '123'))
            .toBe(false)
    })

    it('limits engagement creation to admins and talent managers', () => {
        expect(canCreateEngagement(['copilot']))
            .toBe(false)
        expect(canCreateEngagement(['project manager']))
            .toBe(false)
        expect(canCreateEngagement(['administrator']))
            .toBe(true)
        expect(canCreateEngagement(['topcoder talent manager']))
            .toBe(true)
        expect(canCreateEngagement(['copilot', 'talent manager']))
            .toBe(true)
    })

    it('normalizes project membership checks and role lookups by user id', () => {
        expect(checkProjectMembership(managedProject, '123'))
            .toBe(true)
        expect(getProjectMemberRole(managedProject, '123'))
            .toBe('manager')
    })

    it('matches invited users by normalized user id or email', () => {
        mockedDecodeToken.mockReturnValue({
            email: 'tm@example.com',
            handle: 'TalentManager',
            userId: '123',
        } as ReturnType<typeof decodeToken>)

        expect(checkIsUserInvitedToProject('token', {
            ...managedProject,
            invites: [
                {
                    email: 'TM@EXAMPLE.COM',
                    role: 'manager',
                    userId: 123,
                },
            ],
        }))
            .toEqual({
                email: 'TM@EXAMPLE.COM',
                role: 'manager',
                userId: 123,
            })
    })
})
