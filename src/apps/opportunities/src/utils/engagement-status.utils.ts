import { EngagementOpportunity } from '../models'

interface EngagementAssignmentSummary {
    createdAt?: string
    id?: string
    status?: string
    updatedAt?: string
}

const STATUS_LABELS: Record<string, string> = {
    accepted: 'Selected',
    applied: 'Applied',
    approved: 'Selected',
    assigned: 'Assigned',
    completed: 'Completed',
    offerdeclined: 'Offer Declined',
    offerrejected: 'Offer Declined',
    onhold: 'On Hold',
    pendingassignment: 'On Hold',
    rejected: 'Rejected',
    selected: 'Selected',
    shortlisted: 'Shortlisted',
    submitted: 'Applied',
    terminated: 'Terminated',
    underreview: 'Under Review',
}

const ASSIGNMENT_STATUS_PRIORITY: Record<string, number> = {
    assigned: 2,
    completed: 3,
    offerdeclined: 5,
    offerrejected: 5,
    selected: 1,
    terminated: 4,
}

const TERMINAL_MEMBER_STATUS_KEYS: Set<string> = new Set([
    'completed',
    'offerdeclined',
    'offerrejected',
    'rejected',
    'terminated',
])

const TERMINAL_LIFECYCLE_STATUS_KEYS: Set<string> = new Set([
    'cancelled',
    'closed',
])

function statusKey(value: unknown): string {
    return String(value ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
}

function titleCase(value: string): string {
    return value
        .split(/[_\s]+/)
        .filter(Boolean)
        .map(part => `${part.charAt(0)
            .toUpperCase()}${part.slice(1)
            .toLowerCase()}`)
        .join(' ')
}

function assignmentTimestamp(assignment: EngagementAssignmentSummary): number {
    const updated = Date.parse(String(assignment.updatedAt ?? ''))
    if (Number.isFinite(updated)) return updated

    const created = Date.parse(String(assignment.createdAt ?? ''))
    if (Number.isFinite(created)) return created

    return Number.NEGATIVE_INFINITY
}

function compareAssignments(
    left: EngagementAssignmentSummary,
    right: EngagementAssignmentSummary,
): number {
    const timestampDifference = assignmentTimestamp(right) - assignmentTimestamp(left)
    if (timestampDifference !== 0 && !Number.isNaN(timestampDifference)) return timestampDifference

    const priorityDifference = (ASSIGNMENT_STATUS_PRIORITY[statusKey(right.status)] ?? 0)
        - (ASSIGNMENT_STATUS_PRIORITY[statusKey(left.status)] ?? 0)
    if (priorityDifference !== 0) return priorityDifference

    return String(right.id ?? '')
        .localeCompare(String(left.id ?? ''))
}

/** Returns the member-specific engagement status, preferring the latest assignment row. */
export function engagementMemberStatus(item: EngagementOpportunity): string | undefined {
    const assignmentStatus = [...(item.assignments ?? [])]
        .sort(compareAssignments)[0]?.status
    return assignmentStatus ?? item.applicationStatus ?? item.myApplication?.status
}

/** Maps raw engagement, application, and assignment statuses to authored labels. */
export function engagementStatusLabel(value?: string): string | undefined {
    if (!value) return undefined

    const normalized = statusKey(value)
    return STATUS_LABELS[normalized] ?? titleCase(String(value)
        .replace(/_/g, ' '))
}

/**
 * Builds the status pill shown on engagement opportunity cards.
 *
 * Member-specific application or assignment state takes precedence over public
 * availability. Public ON_HOLD still surfaces as an authored pill when no
 * member-specific state is present.
 */
export function engagementOpportunityState(
    item: EngagementOpportunity,
    memberApplied: boolean,
    open: boolean,
): string {
    const memberLabel = engagementStatusLabel(engagementMemberStatus(item))
    if (memberLabel) return memberLabel

    const publicLabel = engagementStatusLabel(item.status)
    if (statusKey(item.status) === 'onhold') return publicLabel ?? 'On Hold'

    if (memberApplied) return 'Applied'
    return open ? 'Open for application' : 'Application closed'
}

/** Resolves the member-facing My Work status for engagements. */
export function myEngagementState(item: EngagementOpportunity): string {
    const memberLabel = engagementStatusLabel(engagementMemberStatus(item))
    if (memberLabel) return memberLabel
    if (statusKey(item.status) === 'onhold') return 'On Hold'
    return 'Applied'
}

/**
 * Resolves whether a My Work engagement should land in the active or past bucket.
 *
 * Member-specific assignment or application state wins over the public engagement
 * lifecycle so completed, terminated, or rejected member outcomes still appear in
 * Past even when the engagement remains publicly active. When no member-specific
 * status exists, the public lifecycle acts as the fallback bucket source.
 */
export function myEngagementBucket(item: EngagementOpportunity): 'active' | 'past' {
    const memberStatus = statusKey(engagementMemberStatus(item))
    if (memberStatus) {
        return TERMINAL_MEMBER_STATUS_KEYS.has(memberStatus) ? 'past' : 'active'
    }

    return TERMINAL_LIFECYCLE_STATUS_KEYS.has(statusKey(item.status)) ? 'past' : 'active'
}
