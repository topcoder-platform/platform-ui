import { decodeToken } from 'tc-auth-lib'

import type { Project } from '../models'

import {
    buildProjectChallengesPath,
    buildProjectLandingPath,
} from './navigation.utils'

jest.mock('tc-auth-lib', () => ({
    decodeToken: jest.fn(),
}))

jest.mock('~/config', () => ({
    AppSubdomain: {
        work: 'work',
    },
    EnvironmentConfig: new Proxy({}, {
        get: (_target, property: string): string => {
            if (property === 'SUBDOMAIN') {
                return 'work'
            }

            return 'https://www.topcoder-dev.com'
        },
    }),
}), { virtual: true })

jest.mock('../services/resources.service', () => ({
    fetchResourceRoles: jest.fn(),
    fetchResources: jest.fn(),
}))

const mockedDecodeToken = decodeToken as jest.MockedFunction<typeof decodeToken>

describe('buildProjectChallengesPath', () => {
    it('returns the canonical challenges route for a project', () => {
        expect(buildProjectChallengesPath('project / 200'))
            .toBe('/projects/project%20%2F%20200/challenges')
    })
})

describe('buildProjectLandingPath', () => {
    const project: Project = {
        id: '200',
        name: 'Invited project',
        status: 'active',
    }

    afterEach(() => {
        mockedDecodeToken.mockReset()
    })

    it('routes the invited user to the invitation modal path', () => {
        mockedDecodeToken.mockReturnValue({
            email: 'invitee@example.com',
            userId: '123',
        } as ReturnType<typeof decodeToken>)

        expect(buildProjectLandingPath({
            ...project,
            invites: [
                {
                    email: 'INVITEE@EXAMPLE.COM',
                    status: 'pending',
                    userId: 123,
                },
            ],
        }, 'token'))
            .toBe('/projects/200/invitations')
    })

    it('routes the invited user to the invitation modal path for requested invites', () => {
        mockedDecodeToken.mockReturnValue({
            email: 'invitee@example.com',
            userId: '123',
        } as ReturnType<typeof decodeToken>)

        expect(buildProjectLandingPath({
            ...project,
            invites: [
                {
                    email: 'invitee@example.com',
                    status: 'requested',
                    userId: 123,
                },
            ],
        }, 'token'))
            .toBe('/projects/200/invitations')
    })

    it('routes the invited user to the invitation modal path when only isInvited is available', () => {
        expect(buildProjectLandingPath({
            ...project,
            isInvited: true,
        }))
            .toBe('/projects/200/invitations')
    })

    it('keeps the challenges path when the matched invite is already accepted', () => {
        mockedDecodeToken.mockReturnValue({
            email: 'invitee@example.com',
            userId: '123',
        } as ReturnType<typeof decodeToken>)

        expect(buildProjectLandingPath({
            ...project,
            invites: [
                {
                    email: 'invitee@example.com',
                    status: 'accepted',
                    userId: 123,
                },
            ],
        }, 'token'))
            .toBe('/projects/200/challenges')
    })

    it('routes re-invited users to the invitation modal when an older invite was already accepted', () => {
        mockedDecodeToken.mockReturnValue({
            email: 'invitee@example.com',
            userId: '123',
        } as ReturnType<typeof decodeToken>)

        expect(buildProjectLandingPath({
            ...project,
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
        }, 'token'))
            .toBe('/projects/200/invitations')
    })

    it('keeps the challenges path when the invites belong to another user', () => {
        mockedDecodeToken.mockReturnValue({
            email: 'manager@example.com',
            userId: '999',
        } as ReturnType<typeof decodeToken>)

        expect(buildProjectLandingPath({
            ...project,
            invites: [
                {
                    email: 'invitee@example.com',
                    userId: 123,
                },
            ],
        }, 'token'))
            .toBe('/projects/200/challenges')
    })
})
