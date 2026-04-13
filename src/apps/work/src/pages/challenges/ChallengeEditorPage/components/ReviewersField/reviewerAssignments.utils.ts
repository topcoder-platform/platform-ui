import {
    Resource,
    ResourceRole,
    Reviewer,
} from '../../../../../lib/models'

import {
    normalizeReviewerText,
} from './reviewers-field.utils'

const GENERIC_REVIEWER_ROLE_NAMES = ['Reviewer'] as const
const ITERATIVE_REVIEW_ROLE_NAMES = [
    'Iterative Reviewer',
    'Iterative Review',
] as const

/**
 * Normalizes reviewer-role lookup keys so aliases match across legacy payloads.
 *
 * @param value raw reviewer role name or phase name.
 * @returns lowercase text without separator characters.
 */
function normalizeReviewerRoleKey(value: unknown): string {
    return normalizeReviewerText(value)
        .toLowerCase()
        .replace(/[-_\s]/g, '')
}

/**
 * Maps a challenge phase name to the primary reviewer resource role used by Work Manager.
 *
 * @param phaseName human-readable phase name.
 * @returns the preferred reviewer resource role for that phase.
 */
function getPrimaryReviewerRoleNamesForPhaseName(phaseName: string | undefined): string[] {
    const normalizedPhaseName = normalizeReviewerRoleKey(phaseName)

    if (normalizedPhaseName === 'approval') {
        return ['Approver']
    }

    if (normalizedPhaseName === 'checkpointscreening') {
        return ['Checkpoint Screener']
    }

    if (normalizedPhaseName === 'checkpointreview') {
        return ['Checkpoint Reviewer']
    }

    if (normalizedPhaseName === 'iterativereview') {
        return [...ITERATIVE_REVIEW_ROLE_NAMES]
    }

    if (normalizedPhaseName === 'screening') {
        return ['Screener']
    }

    return [...GENERIC_REVIEWER_ROLE_NAMES]
}

/**
 * Returns the ordered reviewer-role groups that should be tried for a phase.
 *
 * Some legacy design challenges persist all human-review resources under the generic
 * `Reviewer` role. When a more specific role like `Approver` is missing, the editor
 * falls back to that generic role so saved assignments still rehydrate correctly.
 *
 * @param phaseName human-readable phase name.
 * @returns ordered groups of acceptable reviewer role names.
 */
function getReviewerRoleNameGroupsForPhaseName(phaseName: string | undefined): string[][] {
    const primaryRoleNames = getPrimaryReviewerRoleNamesForPhaseName(phaseName)

    return primaryRoleNames.some(roleName => (
        normalizeReviewerRoleKey(roleName) === normalizeReviewerRoleKey(GENERIC_REVIEWER_ROLE_NAMES[0])
    ))
        ? [primaryRoleNames]
        : [
            primaryRoleNames,
            [...GENERIC_REVIEWER_ROLE_NAMES],
        ]
}

/**
 * Matches a persisted reviewer resource by role id first, then by legacy role name aliases.
 *
 * @param resource challenge resource candidate.
 * @param roleId resolved role id for the current reviewer group.
 * @param roleNames accepted legacy role-name aliases.
 * @returns `true` when the resource belongs to the reviewer group.
 */
function resourceMatchesReviewerRole(
    resource: Pick<Resource, 'role' | 'roleId' | 'roleName'>,
    roleId: string | undefined,
    roleNames: string[],
): boolean {
    const normalizedRoleId = normalizeReviewerText(roleId)

    if (normalizedRoleId && normalizeReviewerText(resource.roleId) === normalizedRoleId) {
        return true
    }

    const normalizedRoleNames = new Set(
        roleNames
            .map(roleName => normalizeReviewerRoleKey(roleName))
            .filter(Boolean),
    )
    const normalizedResourceRoleName = normalizeReviewerRoleKey(resource.role || resource.roleName)

    return !!normalizedResourceRoleName && normalizedRoleNames.has(normalizedResourceRoleName)
}

interface ReviewerRoleMatchGroup {
    key: string
    roleId?: string
    roleNames: string[]
}

/**
 * Builds the ordered reviewer-resource groups that should be attempted for a reviewer row.
 *
 * @param reviewer reviewer row from the challenge payload.
 * @param phaseNameById map of phase ids to phase names.
 * @param resourceRoles available resource-role metadata.
 * @returns ordered role groups keyed for row-order allocation.
 */
function getReviewerRoleMatchGroups(
    reviewer: Reviewer,
    phaseNameById: Map<string, string>,
    resourceRoles: ResourceRole[],
): ReviewerRoleMatchGroup[] {
    const groups: ReviewerRoleMatchGroup[] = []
    const seenKeys = new Set<string>()
    const explicitRoleId = normalizeReviewerText(reviewer.roleId)
    const phaseName = phaseNameById.get(normalizeReviewerText(reviewer.phaseId))

    if (explicitRoleId) {
        const explicitRoleKey = `id:${explicitRoleId}`

        groups.push({
            key: explicitRoleKey,
            roleId: explicitRoleId,
            roleNames: [],
        })
        seenKeys.add(explicitRoleKey)
    }

    getReviewerRoleNameGroupsForPhaseName(phaseName)
        .forEach(roleNames => {
            const resolvedRoleId = roleNames
                .map(roleName => resourceRoles.find(
                    role => normalizeReviewerRoleKey(role.name) === normalizeReviewerRoleKey(roleName),
                )?.id)
                .find((roleId): roleId is string => !!roleId)
            const nextKey = resolvedRoleId
                ? `id:${resolvedRoleId}`
                : `name:${roleNames.map(roleName => normalizeReviewerRoleKey(roleName))
                    .join('|')}`

            if (seenKeys.has(nextKey)) {
                return
            }

            groups.push({
                key: nextKey,
                roleId: resolvedRoleId,
                roleNames,
            })
            seenKeys.add(nextKey)
        })

    return groups
}

interface BuildAssignedResourcesByReviewerParams {
    getReviewerCount: (reviewer: Reviewer) => number
    phaseNameById: Map<string, string>
    resourceRoles: ResourceRole[]
    resources: Resource[]
    reviewers: Reviewer[]
}

/**
 * Allocates persisted reviewer resources across reviewer rows in display order.
 *
 * Reviewer assignments are stored per role rather than per reviewer row. This helper
 * mirrors Work Manager by consuming resources sequentially for repeated rows that share
 * the same role pool, while still honoring persisted `reviewer.roleId` values first and
 * falling back to the generic `Reviewer` role when legacy design drafts were saved that way.
 * If a phase-specific role pool is partially or fully exhausted, allocation continues into
 * later fallback groups so mixed legacy resource layouts still show every assigned reviewer.
 *
 * @param params reviewer rows, resources, resource roles, and a reviewer-count resolver.
 * @returns a row-aligned list of matching persisted resources for each reviewer row.
 */
export function buildAssignedResourcesByReviewer(
    params: BuildAssignedResourcesByReviewerParams,
): Resource[][] {
    const roleOffsets = new Map<string, number>()

    return params.reviewers.map(reviewer => {
        const reviewerCount = Math.max(1, params.getReviewerCount(reviewer))
        const roleMatchGroups = getReviewerRoleMatchGroups(
            reviewer,
            params.phaseNameById,
            params.resourceRoles,
        )
        const assignedResources: Resource[] = []

        for (const roleMatchGroup of roleMatchGroups) {
            const matchingResources = params.resources
                .filter(resource => resourceMatchesReviewerRole(
                    resource,
                    roleMatchGroup.roleId,
                    roleMatchGroup.roleNames,
                ))

            if (matchingResources.length) {
                const roleOffset = roleOffsets.get(roleMatchGroup.key) || 0

                if (roleOffset < matchingResources.length) {
                    const remainingReviewerSlots = reviewerCount - assignedResources.length
                    const allocatedResources = matchingResources.slice(
                        roleOffset,
                        roleOffset + remainingReviewerSlots,
                    )

                    if (allocatedResources.length) {
                        roleOffsets.set(roleMatchGroup.key, roleOffset + allocatedResources.length)
                        assignedResources.push(...allocatedResources)

                        if (assignedResources.length >= reviewerCount) {
                            break
                        }
                    }
                }
            }
        }

        return assignedResources
    })
}
