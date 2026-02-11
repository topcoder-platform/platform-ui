import {
    Engagement,
    EngagementAnticipatedStart,
    EngagementRole,
    EngagementStatus,
    EngagementWorkload,
} from '../models'

const STATUS_TO_API: Record<string, string> = {
    Active: 'ACTIVE',
    Cancelled: 'CANCELLED',
    Closed: 'CLOSED',
    Open: 'OPEN',
    'Pending Assignment': 'PENDING_ASSIGNMENT',
}

const STATUS_FROM_API: Record<string, EngagementStatus> = {
    ACTIVE: 'Active',
    CANCELLED: 'Cancelled',
    CLOSED: 'Closed',
    OPEN: 'Open',
    PENDING_ASSIGNMENT: 'Pending Assignment',
}

const ROLE_TO_API: Record<string, string> = {
    CONTRACT: 'CONTRACT',
    FULL_TIME: 'FULL_TIME',
    PART_TIME: 'PART_TIME',
}

const ROLE_FROM_API: Record<string, EngagementRole> = {
    CONTRACT: 'CONTRACT',
    FULL_TIME: 'FULL_TIME',
    PART_TIME: 'PART_TIME',
}

const WORKLOAD_TO_API: Record<string, string> = {
    FULL_TIME: 'FULL_TIME',
    PART_TIME: 'PART_TIME',
}

const WORKLOAD_FROM_API: Record<string, EngagementWorkload> = {
    FULL_TIME: 'FULL_TIME',
    PART_TIME: 'PART_TIME',
}

const ANTICIPATED_START_LABELS: Record<string, string> = {
    FEW_DAYS: 'In a few days',
    FEW_WEEKS: 'In a few weeks',
    IMMEDIATE: 'Immediate',
}

const TERMINAL_ASSIGNMENT_STATUSES = new Set([
    'COMPLETED',
    'OFFER_REJECTED',
    'TERMINATED',
])

function normalizeString(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    return value.trim()
}

function toUpperSnake(value: string): string {
    return value
        .trim()
        .replace(/[\s-]+/g, '_')
        .toUpperCase()
}

function toIsoString(value: unknown): string {
    if (typeof value === 'string') {
        return value
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString()
    }

    return ''
}

function toNumber(value: unknown, fallback: number = 0): number {
    const parsed = Number(value)

    if (!Number.isFinite(parsed)) {
        return fallback
    }

    return parsed
}

export function normalizeEngagementAssignmentStatus(status: string): string {
    if (!status) {
        return ''
    }

    return status
        .toString()
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, '_')
}

export function isEngagementAssignmentCompletionStatus(status: string): boolean {
    const normalizedStatus = normalizeEngagementAssignmentStatus(status)

    if (!normalizedStatus) {
        return false
    }

    return TERMINAL_ASSIGNMENT_STATUSES.has(normalizedStatus)
}

export function isCountableEngagementAssignmentStatus(status: string): boolean {
    return !isEngagementAssignmentCompletionStatus(status)
}

export function getCountableEngagementAssignments(
    assignments: Engagement['assignments'] = [],
): Engagement['assignments'] {
    if (!Array.isArray(assignments)) {
        return []
    }

    return assignments.filter(assignment => {
        const status = assignment.status || ''

        return isCountableEngagementAssignmentStatus(String(status))
    })
}

export function normalizeEngagement(data: Partial<Engagement> = {}): Engagement {
    const assignments = Array.isArray(data.assignments)
        ? data.assignments
        : []

    const skills = Array.isArray(data.skills)
        ? data.skills
        : []

    const assignedMemberHandles = Array.isArray(data.assignedMemberHandles)
        ? data.assignedMemberHandles
            .map(value => normalizeString(value))
            .filter(Boolean)
        : []

    const countries = Array.isArray(data.countries)
        ? data.countries
            .map(value => normalizeString(value))
            .filter(Boolean)
        : []

    const timezones = Array.isArray(data.timezones)
        ? data.timezones
            .map(value => normalizeString(value))
            .filter(Boolean)
        : []

    const anticipatedStart = data.anticipatedStart
        ? fromEngagementAnticipatedStartApi(data.anticipatedStart)
        : 'IMMEDIATE'

    const status = data.status
        ? fromEngagementStatusApi(data.status)
        : 'Open'

    const role = data.role
        ? fromEngagementRoleApi(data.role)
        : 'FULL_TIME'

    const workload = data.workload
        ? fromEngagementWorkloadApi(data.workload)
        : 'FULL_TIME'

    return {
        anticipatedStart,
        applications: Array.isArray(data.applications)
            ? data.applications
            : [],
        applicationsCount: getApplicationsCount(data),
        assignedMemberHandles,
        assignments,
        compensationRange: normalizeString(data.compensationRange),
        countries,
        createdAt: toIsoString(data.createdAt),
        description: normalizeString(data.description),
        durationWeeks: toNumber(data.durationWeeks),
        id: data.id || '',
        isPrivate: data.isPrivate === true,
        projectId: data.projectId || '',
        requiredMemberCount: toNumber(data.requiredMemberCount),
        role,
        skills,
        status,
        timezones,
        title: normalizeString(data.title),
        updatedAt: toIsoString(data.updatedAt),
        workload,
    }
}

export function formatAnticipatedStart(value: string | EngagementAnticipatedStart): string {
    if (!value) {
        return '-'
    }

    const key = toUpperSnake(String(value))

    return ANTICIPATED_START_LABELS[key] || value
}

export function formatEngagementStatus(value: string | EngagementStatus): string {
    const normalized = toUpperSnake(String(value || ''))

    if (!normalized) {
        return '-'
    }

    return STATUS_FROM_API[normalized] || value
}

export function formatDuration(engagement: Partial<Engagement>): string {
    if (engagement.durationWeeks && engagement.durationWeeks > 0) {
        return `${engagement.durationWeeks} weeks`
    }

    return '-'
}

export function getEngagementDurationInDays(engagement: Partial<Engagement>): number {
    if (!engagement.durationWeeks || engagement.durationWeeks <= 0) {
        return 0
    }

    return engagement.durationWeeks * 7
}

export function formatLocation(engagement: Partial<Engagement>): string {
    const countries = Array.isArray(engagement.countries)
        ? engagement.countries
            .map(value => normalizeString(value))
            .filter(Boolean)
        : []
    const timezones = Array.isArray(engagement.timezones)
        ? engagement.timezones
            .map(value => normalizeString(value))
            .filter(Boolean)
        : []

    if (!countries.length && !timezones.length) {
        return 'Remote'
    }

    if (!countries.length) {
        return timezones.join(', ')
    }

    if (!timezones.length) {
        return countries.join(', ')
    }

    return `${timezones.join(', ')} / ${countries.join(', ')}`
}

export function getAssignedMembersCount(engagement: Partial<Engagement>): number {
    const assignments = Array.isArray(engagement.assignments)
        ? engagement.assignments
        : []

    if (assignments.length) {
        return getCountableEngagementAssignments(assignments).length
    }

    const assignedMemberHandles = Array.isArray(engagement.assignedMemberHandles)
        ? engagement.assignedMemberHandles
            .map(value => normalizeString(value))
            .filter(Boolean)
        : []

    return assignedMemberHandles.length
}

export function hasCountableAssignments(engagement: Partial<Engagement>): boolean {
    const assignments = Array.isArray(engagement.assignments)
        ? engagement.assignments
        : []

    return getCountableEngagementAssignments(assignments).length > 0
}

export function getApplicationsCount(engagement: Partial<Engagement>): number {
    if (typeof engagement.applicationsCount === 'number') {
        return engagement.applicationsCount
    }

    if (Array.isArray(engagement.applications)) {
        return engagement.applications.length
    }

    const maybeCount = (engagement as {
        applicationCount?: unknown
        applications_count?: unknown
        count?: {
            applications?: unknown
        }
    })
    const legacyCount = Reflect.get(engagement as Record<string, unknown>, '_count') as {
        applications?: unknown
    } | undefined

    if (typeof maybeCount.applicationCount === 'number') {
        return maybeCount.applicationCount
    }

    if (typeof maybeCount.applications_count === 'number') {
        return maybeCount.applications_count
    }

    if (typeof maybeCount.count?.applications === 'number') {
        return maybeCount.count.applications
    }

    if (typeof legacyCount?.applications === 'number') {
        return legacyCount.applications
    }

    return 0
}

export function toEngagementStatusApi(status: string): string {
    const normalized = normalizeString(status)

    if (!normalized) {
        return ''
    }

    return STATUS_TO_API[normalized] || toUpperSnake(normalized)
}

export function fromEngagementStatusApi(status: string): EngagementStatus | string {
    const normalized = toUpperSnake(normalizeString(status))

    if (!normalized) {
        return 'Open'
    }

    return STATUS_FROM_API[normalized] || status
}

export function toEngagementRoleApi(role: string): string {
    const normalized = toUpperSnake(normalizeString(role))

    if (!normalized) {
        return ''
    }

    return ROLE_TO_API[normalized] || normalized
}

export function fromEngagementRoleApi(role: string): EngagementRole | string {
    const normalized = toUpperSnake(normalizeString(role))

    if (!normalized) {
        return 'FULL_TIME'
    }

    return ROLE_FROM_API[normalized] || role
}

export function toEngagementWorkloadApi(workload: string): string {
    const normalized = toUpperSnake(normalizeString(workload))

    if (!normalized) {
        return ''
    }

    return WORKLOAD_TO_API[normalized] || normalized
}

export function fromEngagementWorkloadApi(workload: string): EngagementWorkload | string {
    const normalized = toUpperSnake(normalizeString(workload))

    if (!normalized) {
        return 'FULL_TIME'
    }

    return WORKLOAD_FROM_API[normalized] || workload
}

export function toEngagementAnticipatedStartApi(value: string): string {
    const normalized = toUpperSnake(normalizeString(value))

    if (!normalized) {
        return ''
    }

    if (normalized === 'IN_A_FEW_DAYS') {
        return 'FEW_DAYS'
    }

    if (normalized === 'IN_A_FEW_WEEKS') {
        return 'FEW_WEEKS'
    }

    return normalized
}

export function fromEngagementAnticipatedStartApi(
    value: string,
): EngagementAnticipatedStart | string {
    const normalized = toUpperSnake(normalizeString(value))

    if (!normalized) {
        return 'IMMEDIATE'
    }

    if (normalized === 'IN_A_FEW_DAYS') {
        return 'FEW_DAYS'
    }

    if (normalized === 'IN_A_FEW_WEEKS') {
        return 'FEW_WEEKS'
    }

    return normalized
}
