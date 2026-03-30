import type {
    Challenge,
    Resource,
    ResourceRole,
    WorkAppContextModel,
} from '../../../lib/models'

import {
    buildTaskWinnerPayload,
    getAssignedTaskMember,
    getCompleteTaskConfirmationMessage,
    getTaskPrizeAmount,
    isSelfAssignedCopilot,
    shouldShowCompleteTaskAction,
} from './ChallengeEditorPage.utils'

function buildChallenge(overrides: Partial<Challenge> = {}): Challenge {
    return {
        id: 'challenge-id',
        name: 'Task Challenge',
        prizeSets: [],
        status: 'ACTIVE',
        task: {
            isTask: true,
        },
        ...overrides,
    }
}

function buildResource(overrides: Partial<Resource> = {}): Resource {
    return {
        challengeId: 'challenge-id',
        memberHandle: 'task-user',
        memberId: '12345',
        roleId: 'submitter-role-id',
        ...overrides,
    }
}

function buildResourceRole(overrides: Partial<ResourceRole> = {}): ResourceRole {
    return {
        id: 'submitter-role-id',
        name: 'Submitter',
        ...overrides,
    }
}

function buildContext(overrides: Partial<WorkAppContextModel> = {}): WorkAppContextModel {
    return {
        isAdmin: false,
        isAnonymous: false,
        isCopilot: false,
        isManager: false,
        isReadOnly: false,
        loginUserInfo: undefined,
        userRoles: [],
        ...overrides,
    }
}

describe('shouldShowCompleteTaskAction', () => {
    it('returns true for active task challenges on the details tab', () => {
        const result = shouldShowCompleteTaskAction(
            true,
            'details',
            buildChallenge(),
        )

        expect(result)
            .toBe(true)
    })

    it('returns false when the challenge is not an active task on the details tab', () => {
        expect(shouldShowCompleteTaskAction(
            true,
            'resources',
            buildChallenge(),
        ))
            .toBe(false)

        expect(shouldShowCompleteTaskAction(
            true,
            'details',
            buildChallenge({
                task: {
                    isTask: false,
                },
            }),
        ))
            .toBe(false)
    })
})

describe('getTaskPrizeAmount', () => {
    it('returns the first placement prize amount', () => {
        const result = getTaskPrizeAmount([
            {
                prizes: [{
                    type: 'USD',
                    value: 500,
                }],
                type: 'PLACEMENT',
            },
        ])

        expect(result)
            .toBe(500)
    })
})

describe('getAssignedTaskMember', () => {
    it('returns the single submitter assigned to the task', () => {
        const result = getAssignedTaskMember(
            buildChallenge(),
            [buildResource()],
            [buildResourceRole()],
        )

        expect(result)
            .toEqual({
                handle: 'task-user',
                userId: '12345',
            })
    })

    it('falls back to the saved assignedMemberId when submitter role metadata is unavailable', () => {
        const result = getAssignedTaskMember(
            buildChallenge({
                assignedMemberId: '12345',
            }),
            [buildResource({
                roleId: 'some-other-role-id',
            })],
            [],
        )

        expect(result)
            .toEqual({
                handle: 'task-user',
                userId: '12345',
            })
    })

    it('returns undefined when multiple submitters are assigned', () => {
        const result = getAssignedTaskMember(
            buildChallenge(),
            [
                buildResource(),
                buildResource({
                    memberHandle: 'task-user-2',
                    memberId: '67890',
                }),
            ],
            [buildResourceRole()],
        )

        expect(result)
            .toBeUndefined()
    })
})

describe('task completion helpers', () => {
    it('detects self-assigned copilots using the logged-in user id', () => {
        const result = isSelfAssignedCopilot(
            buildContext({
                isCopilot: true,
                loginUserInfo: {
                    userId: 12345,
                },
            }),
            {
                handle: 'task-user',
                userId: '12345',
            },
        )

        expect(result)
            .toBe(true)
    })

    it('builds the legacy winner payload and confirmation message', () => {
        const assignedTaskMember = {
            handle: 'task-user',
            userId: '12345',
        }

        expect(buildTaskWinnerPayload(assignedTaskMember))
            .toEqual([{
                handle: 'task-user',
                placement: 1,
                userId: '12345',
            }])

        expect(getCompleteTaskConfirmationMessage(
            'Task Challenge',
            500,
            assignedTaskMember,
        ))
            .toBe('Are you sure want to complete task "Task Challenge" with the prize $500 for task-user?')
    })
})
