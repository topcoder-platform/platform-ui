import { decodeToken } from '@topcoder-platform/tc-auth-lib'

import type {
    Challenge,
    Project,
} from '../models'

import {
    canCreateEngagement,
    canModifyChallenge,
    canViewAllEngagements,
    checkCanEditProjectDetails,
    checkCanManageProject,
    checkIsUserInvitedToProject,
    checkProjectAccess,
    checkProjectMembership,
    getProjectMemberRole,
} from './permissions.utils'

jest.mock('@topcoder-platform/tc-auth-lib', () => ({
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
    const challenge: Challenge = {
        createdBy: 'challenge-owner',
        id: 'challenge-123',
        name: 'Permission test challenge',
        status: 'COMPLETED',
    }
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
            {
                role: 'copilot',
                userId: 789,
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

    it('allows project managers to create projects without a project context', () => {
        expect(checkCanManageProject(['Project Manager'], '123'))
            .toBe(true)
    })

    it('requires project manager or copilot membership for talent manager edit access', () => {
        expect(checkCanManageProject(['Talent Manager'], '123', managedProject))
            .toBe(true)
        expect(checkCanManageProject(['Talent Manager'], '456', managedProject))
            .toBe(false)
    })

    it('allows project managers to edit projects when they have manager membership', () => {
        expect(checkCanManageProject(['Project Manager'], '123', managedProject))
            .toBe(true)
    })

    it('blocks project managers from editing projects without manager access', () => {
        expect(checkCanManageProject(['Project Manager'], '456', managedProject))
            .toBe(false)
    })

    it('requires full access membership for project details edits', () => {
        expect(checkCanEditProjectDetails(['Talent Manager'], '123', managedProject))
            .toBe(true)
        expect(checkCanEditProjectDetails(['Talent Manager'], '789', managedProject))
            .toBe(false)
        expect(checkCanEditProjectDetails(['Project Manager'], '456', managedProject))
            .toBe(false)
    })

    it('allows admins to edit project details without membership', () => {
        expect(checkCanEditProjectDetails(['administrator'], '999', managedProject))
            .toBe(true)
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

    it('limits all-engagement access to admins and talent managers', () => {
        expect(canViewAllEngagements(['copilot']))
            .toBe(false)
        expect(canViewAllEngagements(['project manager']))
            .toBe(false)
        expect(canViewAllEngagements(['administrator']))
            .toBe(true)
        expect(canViewAllEngagements(['topcoder talent manager']))
            .toBe(true)
    })

    it('normalizes project membership checks and role lookups by user id', () => {
        expect(checkProjectMembership(managedProject, '123'))
            .toBe(true)
        expect(getProjectMemberRole(managedProject, '123'))
            .toBe('manager')
    })

    it('allows project workspace access for admins and project members only', () => {
        expect(checkProjectAccess(['administrator'], '999', managedProject))
            .toBe(true)
        expect(checkProjectAccess(['Project Manager'], '123', managedProject))
            .toBe(true)
        expect(checkProjectAccess(['Project Manager'], '999', managedProject))
            .toBe(false)
        expect(checkProjectAccess(['Project Manager'], '123', undefined))
            .toBe(false)
    })

    it('allows challenge modification for admins and the normalized challenge creator', () => {
        expect(canModifyChallenge({
            challenge,
            hasChallengeResourceWriteAccess: false,
            loginUserInfo: {
                handle: 'different-user',
                userId: 999,
            },
            project: managedProject,
            userRoles: ['administrator'],
        }))
            .toBe(true)
        expect(canModifyChallenge({
            challenge,
            hasChallengeResourceWriteAccess: false,
            loginUserInfo: {
                handle: ' Challenge-Owner ',
                userId: 999,
            },
            project: managedProject,
            userRoles: [],
        }))
            .toBe(true)
        expect(canModifyChallenge({
            challenge: {
                ...challenge,
                createdBy: '999',
            },
            hasChallengeResourceWriteAccess: false,
            loginUserInfo: {
                handle: 'different-user',
                userId: 999,
            },
            project: managedProject,
            userRoles: [],
        }))
            .toBe(true)
    })

    it('requires another modifier signal for connect-admin-only challenge mutation access', () => {
        const connectAdminParams = {
            challenge,
            hasChallengeResourceWriteAccess: false,
            loginUserInfo: {
                handle: 'connect-admin-user',
                userId: 999,
            },
            project: managedProject,
            userRoles: [' Connect Admin '],
        }

        expect(canModifyChallenge(connectAdminParams))
            .toBe(false)
        expect(canModifyChallenge({
            ...connectAdminParams,
            hasChallengeResourceWriteAccess: true,
        }))
            .toBe(true)
    })

    it('allows challenge modification for an active full-write challenge resource', () => {
        expect(canModifyChallenge({
            challenge,
            hasChallengeResourceWriteAccess: true,
            loginUserInfo: {
                handle: 'resource-writer',
                userId: 999,
            },
            project: managedProject,
            userRoles: [],
        }))
            .toBe(true)
    })

    it.each([
        'manager',
        'copilot',
        'customer',
        'write',
    ])('allows challenge modification for %s project membership', role => {
        expect(canModifyChallenge({
            challenge,
            hasChallengeResourceWriteAccess: false,
            loginUserInfo: {
                handle: 'project-writer',
                userId: 999,
            },
            project: {
                ...managedProject,
                members: [{
                    role: ` ${role.toUpperCase()} `,
                    userId: 999,
                }],
            },
            userRoles: [],
        }))
            .toBe(true)
    })

    it('rejects observer project members without another challenge modification signal', () => {
        expect(canModifyChallenge({
            challenge,
            hasChallengeResourceWriteAccess: false,
            loginUserInfo: {
                handle: 'project-observer',
                userId: 999,
            },
            project: {
                ...managedProject,
                members: [{
                    role: 'observer',
                    userId: 999,
                }],
            },
            userRoles: ['project manager'],
        }))
            .toBe(false)
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

    it('prefers an open re-invite over older resolved invite records for the same user', () => {
        mockedDecodeToken.mockReturnValue({
            email: 'invitee@example.com',
            handle: 'invitee',
            userId: '123',
        } as ReturnType<typeof decodeToken>)

        expect(checkIsUserInvitedToProject('token', {
            ...managedProject,
            invites: [
                {
                    createdAt: '2026-03-30T00:00:00.000Z',
                    email: 'invitee@example.com',
                    id: 'invite-accepted',
                    status: 'accepted',
                    userId: 123,
                },
                {
                    createdAt: '2026-04-06T00:00:00.000Z',
                    email: 'invitee@example.com',
                    id: 'invite-pending',
                    status: 'pending',
                    userId: 123,
                },
            ],
        }))
            .toEqual(expect.objectContaining({
                id: 'invite-pending',
                status: 'pending',
            }))
    })
})
