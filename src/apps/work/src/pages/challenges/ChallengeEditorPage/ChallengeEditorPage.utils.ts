import type {
    Challenge,
    PrizeSet,
    Resource,
    ResourceRole,
    WorkAppContextModel,
} from '../../../lib/models'

export interface TaskAssignee {
    handle?: string
    userId: string
}

export interface TaskWinnerPayload {
    handle?: string
    placement: number
    userId: string
}

/**
 * Converts optional values to trimmed strings for identity and status comparisons.
 *
 * @param value raw value to normalize
 * @returns a trimmed string or an empty string when the value is not set
 */
function normalizeValue(value: unknown): string {
    return value !== undefined && value !== null
        ? String(value)
            .trim()
        : ''
}

/**
 * Normalizes challenge statuses to the uppercase API form used by comparisons.
 *
 * @param value raw status value
 * @returns normalized uppercase status text
 */
function normalizeStatus(value: unknown): string {
    return normalizeValue(value)
        .toUpperCase()
}

/**
 * Finds the resource-role id used for task submitter assignments.
 *
 * @param resourceRoles fetched resource-role metadata
 * @returns the submitter role id when present
 */
function getSubmitterRoleId(resourceRoles: ResourceRole[]): string | undefined {
    return resourceRoles.find(
        role => normalizeValue(role.name)
            .toLowerCase() === 'submitter',
    )?.id
}

/**
 * Returns the resources currently assigned with the submitter role.
 *
 * @param resources fetched challenge resources
 * @param resourceRoles fetched resource-role metadata
 * @returns resource rows that represent task submitter assignments
 */
function getSubmitterResources(
    resources: Resource[],
    resourceRoles: ResourceRole[],
): Resource[] {
    const submitterRoleId = getSubmitterRoleId(resourceRoles)

    return resources.filter(resource => {
        const normalizedRoleName = normalizeValue(resource.role || resource.roleName)
            .toLowerCase()

        return normalizedRoleName.includes('submitter')
            || (!!submitterRoleId && resource.roleId === submitterRoleId)
    })
}

/**
 * Returns whether the page header should show the task completion action.
 *
 * @param isEditMode whether the page is editing an existing challenge
 * @param activeTab current challenge editor tab
 * @param challenge current challenge payload
 * @returns true when the user is viewing the details tab for an active task challenge
 */
export function shouldShowCompleteTaskAction(
    isEditMode: boolean,
    activeTab: string,
    challenge?: Challenge,
): boolean {
    return isEditMode
        && activeTab === 'details'
        && normalizeStatus(challenge?.status) === 'ACTIVE'
        && challenge?.task?.isTask === true
}

/**
 * Returns the first placement prize amount configured for the task.
 *
 * @param prizeSets challenge prize sets
 * @returns the first placement prize value when available
 */
export function getTaskPrizeAmount(prizeSets?: PrizeSet[]): number | undefined {
    return prizeSets
        ?.find(prizeSet => normalizeValue(prizeSet.type)
            .toUpperCase() === 'PLACEMENT')
        ?.prizes?.[0]?.value
}

/**
 * Resolves the task assignee from saved submitter resource assignments.
 * The legacy flow only permits closing the task when exactly one assignee is present.
 *
 * @param challenge current challenge payload
 * @param resources fetched challenge resources
 * @param resourceRoles fetched resource-role metadata
 * @returns the single resolved task assignee, or undefined when the assignee is missing or ambiguous
 */
export function getAssignedTaskMember(
    challenge: Challenge | undefined,
    resources: Resource[],
    resourceRoles: ResourceRole[],
): TaskAssignee | undefined {
    const submitterResources = getSubmitterResources(resources, resourceRoles)

    if (submitterResources.length === 1) {
        const [submitterResource] = submitterResources
        const userId = normalizeValue(submitterResource.memberId)

        if (!userId) {
            return undefined
        }

        return {
            handle: normalizeValue(submitterResource.memberHandle) || undefined,
            userId,
        }
    }

    const assignedMemberId = normalizeValue(challenge?.assignedMemberId)
    if (!assignedMemberId) {
        return undefined
    }

    const matchedAssignedResources = resources.filter(
        resource => normalizeValue(resource.memberId) === assignedMemberId,
    )
    if (matchedAssignedResources.length !== 1) {
        return undefined
    }

    return {
        handle: normalizeValue(matchedAssignedResources[0].memberHandle) || undefined,
        userId: assignedMemberId,
    }
}

/**
 * Returns whether the logged-in user is both a copilot and the current task assignee.
 * This preserves the legacy rule that self-assigned copilots cannot complete their own task.
 *
 * @param workAppContext current work-app auth context
 * @param assignedTaskMember resolved task assignee
 * @returns true when the complete-task action should stay hidden
 */
export function isSelfAssignedCopilot(
    workAppContext: WorkAppContextModel,
    assignedTaskMember?: TaskAssignee,
): boolean {
    const loginUserId = normalizeValue(workAppContext.loginUserInfo?.userId)

    return workAppContext.isCopilot
        && !!assignedTaskMember?.userId
        && !!loginUserId
        && loginUserId === assignedTaskMember.userId
}

/**
 * Builds the winner payload used when completing a task.
 *
 * @param assignedTaskMember resolved task assignee
 * @returns the single first-place winner payload expected by the challenge patch call
 */
export function buildTaskWinnerPayload(
    assignedTaskMember: TaskAssignee,
): TaskWinnerPayload[] {
    return [{
        handle: assignedTaskMember.handle,
        placement: 1,
        userId: assignedTaskMember.userId,
    }]
}

/**
 * Builds the legacy confirmation copy shown before completing a task challenge.
 *
 * @param challengeName challenge display name
 * @param taskPrizeAmount task placement prize amount
 * @param assignedTaskMember resolved task assignee
 * @returns confirmation text for the completion modal
 */
export function getCompleteTaskConfirmationMessage(
    challengeName: string,
    taskPrizeAmount: number | undefined,
    assignedTaskMember: TaskAssignee,
): string {
    const assignedMemberLabel = assignedTaskMember.handle || `User Id: ${assignedTaskMember.userId}`

    return `Are you sure want to complete task "${challengeName}" `
        + `with the prize $${String(taskPrizeAmount)} for ${assignedMemberLabel}?`
}
