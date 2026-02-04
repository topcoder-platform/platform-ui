import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrGetPaginatedAsync, xhrPatchAsync } from '~/libs/core'
import { fetchSkillsByIds } from '~/libs/shared'

import { EngagementStatus } from '../models'
import type { Engagement, EngagementAssignment, EngagementListResponse } from '../models'

const BASE_URL = `${EnvironmentConfig.API.V6}/engagements/engagements`

interface BackendMeta {
    page?: number
    perPage?: number
    totalCount?: number
    totalPages?: number
}

interface BackendPaginatedResponse<T> {
    data?: T[]
    meta?: BackendMeta
}

interface BackendEngagementAssignment {
    id?: string
    engagementId?: string
    memberId?: string
    memberHandle?: string
    status?: string | null
    termsAccepted?: boolean | null
    agreementRate?: string | number | null
    otherRemarks?: string | null
    startDate?: string | null
    endDate?: string | null
    terminationReason?: string | null
    createdAt?: string
    updatedAt?: string
}

interface BackendEngagement {
    id?: string
    nanoId?: string
    projectId?: string
    title?: string
    description?: string
    duration?: {
        startDate?: string
        endDate?: string
        lengthInWeeks?: number
        lengthInMonths?: number
    }
    durationStartDate?: string
    durationEndDate?: string
    durationWeeks?: number
    durationMonths?: number
    timeZones?: string[]
    countries?: string[]
    requiredSkills?: string[]
    anticipatedStart?: string | null
    status?: string
    createdAt?: string
    updatedAt?: string
    createdBy?: string
    createdByEmail?: string
    assignments?: BackendEngagementAssignment[]
    isPrivate?: boolean
    requiredMemberCount?: number
    role?: string | null
    workload?: string | null
    compensationRange?: string | null
}

type MemberEmailRecord = {
    userId: number | string
    email?: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const USER_ID_PATTERN = /^\d+$/
const UNKNOWN_SKILL_LABEL = 'Unknown skill'

const isUuid = (value: string): boolean => UUID_PATTERN.test(value)

const hydrateEngagementSkills = async (engagements: Engagement[]): Promise<Engagement[]> => {
    const skillIds = Array.from(new Set(
        engagements.flatMap(engagement => (
            engagement.requiredSkills.filter(isUuid)
        )),
    ))

    if (!skillIds.length) {
        return engagements
    }

    let skillNameById = new Map<string, string>()
    try {
        const skills = await fetchSkillsByIds(skillIds)
        skillNameById = new Map(skills.map(skill => [skill.id, skill.name]))
    } catch (error) {
        skillNameById = new Map()
    }

    return engagements.map(engagement => ({
        ...engagement,
        requiredSkills: engagement.requiredSkills.map(skill => (
            isUuid(skill) ? (skillNameById.get(skill) ?? UNKNOWN_SKILL_LABEL) : skill
        )),
    }))
}

export interface GetEngagementsParams {
    page?: number
    perPage?: number
    status?: string
    skills?: string[]
    countries?: string[]
    timeZones?: string[]
    search?: string
}

const normalizePaginatedResponse = <T>(
    response: {
        data: T[] | BackendPaginatedResponse<T>
        page: number
        perPage: number
        total: number
        totalPages: number
    },
    fallbackPage?: number,
    fallbackPerPage?: number,
): { data: T[]; page: number; perPage: number; total: number; totalPages: number } => {
    if (Array.isArray(response.data)) {
        return {
            data: response.data,
            page: response.page,
            perPage: response.perPage,
            total: response.total,
            totalPages: response.totalPages,
        }
    }

    const body = response.data as BackendPaginatedResponse<T> | undefined
    const meta = body?.meta

    return {
        data: body?.data ?? [],
        page: meta?.page ?? (response.page || fallbackPage || 1),
        perPage: meta?.perPage ?? (response.perPage || fallbackPerPage || 0),
        total: meta?.totalCount ?? response.total ?? 0,
        totalPages: meta?.totalPages ?? response.totalPages ?? 0,
    }
}

const normalizeEngagementStatus = (status?: string): EngagementStatus => {
    const normalized = status?.toLowerCase() ?? ''
    if ((Object.values(EngagementStatus) as string[]).includes(normalized)) {
        return normalized as EngagementStatus
    }

    return EngagementStatus.OPEN
}

const normalizeAssignmentStatus = (status?: string | null): string | undefined => {
    if (!status) {
        return undefined
    }

    const normalized = status.toString()
        .trim()
        .toLowerCase()
    return normalized || undefined
}

const firstDefined = <T>(...values: Array<T | undefined>): T | undefined => (
    values.reduce<T | undefined>((acc, value) => acc ?? value ?? undefined, undefined)
)

const withDefault = <T>(fallback: T, ...values: Array<T | undefined>): T => (
    firstDefined(...values) ?? fallback
)

const normalizeEnumValue = (
    value?: string | number | null,
): string | undefined => {
    if (value === null || value === undefined) {
        return undefined
    }

    const normalized = typeof value === 'string' ? value : value.toString()
    return normalized || undefined
}

const normalizeAssignments = (assignments?: BackendEngagementAssignment[]): EngagementAssignment[] => {
    if (!Array.isArray(assignments)) {
        return []
    }

    return assignments.map(assignment => ({
        agreementRate: normalizeEnumValue(assignment.agreementRate),
        createdAt: withDefault('', assignment.createdAt),
        endDate: normalizeEnumValue(assignment.endDate),
        engagementId: withDefault('', assignment.engagementId),
        id: withDefault('', assignment.id),
        memberHandle: withDefault('', assignment.memberHandle),
        memberId: withDefault('', assignment.memberId),
        otherRemarks: normalizeEnumValue(assignment.otherRemarks),
        startDate: normalizeEnumValue(assignment.startDate),
        status: normalizeAssignmentStatus(assignment.status),
        terminationReason: normalizeEnumValue(assignment.terminationReason),
        termsAccepted: assignment.termsAccepted ?? undefined,
        updatedAt: withDefault('', assignment.updatedAt),
    }))
}

const normalizeDuration = (data: BackendEngagement): Engagement['duration'] => {
    const duration: NonNullable<BackendEngagement['duration']> = data.duration ?? {}

    return {
        endDate: firstDefined(duration.endDate, data.durationEndDate),
        lengthInMonths: firstDefined(duration.lengthInMonths, data.durationMonths),
        lengthInWeeks: firstDefined(duration.lengthInWeeks, data.durationWeeks),
        startDate: firstDefined(duration.startDate, data.durationStartDate),
    }
}

const normalizeEngagement = (data: BackendEngagement): Engagement => ({
    anticipatedStart: normalizeEnumValue(data.anticipatedStart),
    assignments: normalizeAssignments(data.assignments),
    compensationRange: data.compensationRange ?? undefined,
    countries: withDefault([], data.countries),
    createdAt: withDefault('', data.createdAt),
    createdBy: withDefault('', data.createdBy),
    createdByEmail: firstDefined(data.createdByEmail),
    description: withDefault('', data.description),
    duration: normalizeDuration(data),
    id: withDefault('', data.id, data.nanoId),
    isPrivate: withDefault(false, data.isPrivate),
    nanoId: withDefault('', data.nanoId, data.id),
    projectId: withDefault('', data.projectId),
    requiredMemberCount: withDefault<number | undefined>(undefined, data.requiredMemberCount),
    requiredSkills: withDefault([], data.requiredSkills),
    role: normalizeEnumValue(firstDefined(data.role)),
    status: normalizeEngagementStatus(data.status),
    timeZones: withDefault([], data.timeZones),
    title: withDefault('', data.title),
    updatedAt: withDefault('', data.updatedAt),
    workload: normalizeEnumValue(firstDefined(data.workload)),
})

const toUserId = (value?: string): number | undefined => {
    const normalized = value?.trim()
    if (!normalized || !USER_ID_PATTERN.test(normalized)) {
        return undefined
    }

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : undefined
}

const hydrateEngagementCreatorEmails = async (
    engagements: Engagement[],
): Promise<Engagement[]> => {
    const userIds = Array.from(new Set(
        engagements
            .filter(engagement => !engagement.createdByEmail)
            .map(engagement => toUserId(engagement.createdBy))
            .filter((value): value is number => Number.isFinite(value)),
    ))

    if (!userIds.length) {
        return engagements
    }

    const qs = userIds.length > 1
        ? userIds
            .map(id => `userIds=${id}`)
            .join('&')
        : `userId=${userIds[0]}`

    try {
        const emailRecords = await xhrGetAsync<MemberEmailRecord[]>(
            `${EnvironmentConfig.API.V6}/members?${qs}&fields=userId,email&perPage=${userIds.length}`,
        )
        const records = Array.isArray(emailRecords) ? emailRecords : []
        const emailByUserId = new Map<number, string>(
            records.map(record => [Number(record.userId), record.email ?? '']),
        )

        return engagements.map(engagement => {
            if (engagement.createdByEmail) {
                return engagement
            }

            const userId = toUserId(engagement.createdBy)
            if (!userId) {
                return engagement
            }

            const email = emailByUserId.get(userId)
            return email ? { ...engagement, createdByEmail: email } : engagement
        })
    } catch (error) {
        return engagements
    }
}

export const getEngagements = async (
    params: GetEngagementsParams = {},
): Promise<EngagementListResponse> => {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.perPage) queryParams.append('perPage', params.perPage.toString())
    if (params.status) {
        const normalizedStatus = params.status.trim()
        if (normalizedStatus) {
            queryParams.append('status', normalizedStatus.toUpperCase())
        }
    }

    if (params.search) queryParams.append('search', params.search)
    if (params.skills?.length) {
        params.skills.forEach(skill => queryParams.append('requiredSkills', skill))
    }

    if (params.countries?.length) {
        params.countries.forEach(country => queryParams.append('countries', country))
    }

    if (params.timeZones?.length) {
        params.timeZones.forEach(timeZone => queryParams.append('timeZones', timeZone))
    }

    const url = `${BASE_URL}?${queryParams.toString()}`
    const response = await xhrGetPaginatedAsync<
        BackendEngagement[] | BackendPaginatedResponse<BackendEngagement>
    >(url)
    const normalized = normalizePaginatedResponse(response, params.page, params.perPage)

    const normalizedEngagements = normalized.data.map(normalizeEngagement)
    const hydratedEngagements = await hydrateEngagementSkills(normalizedEngagements)

    return {
        ...normalized,
        data: hydratedEngagements,
    }
}

export interface GetMyAssignmentsParams {
    page?: number
    perPage?: number
}

export const getMyAssignedEngagements = async (
    params: GetMyAssignmentsParams = {},
): Promise<EngagementListResponse> => {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.perPage) queryParams.append('perPage', params.perPage.toString())

    const queryString = queryParams.toString()
    const url = `${BASE_URL}/my-assignments${queryString ? `?${queryString}` : ''}`
    const response = await xhrGetPaginatedAsync<
        BackendEngagement[] | BackendPaginatedResponse<BackendEngagement>
    >(url)
    const normalized = normalizePaginatedResponse(response, params.page, params.perPage)

    const normalizedEngagements = normalized.data.map(normalizeEngagement)
    const hydratedEngagements = await hydrateEngagementSkills(normalizedEngagements)
    const hydratedWithEmails = await hydrateEngagementCreatorEmails(hydratedEngagements)

    return {
        ...normalized,
        data: hydratedWithEmails,
    }
}

export const acceptAssignmentOffer = async (
    engagementId: string,
    assignmentId: string,
): Promise<void> => {
    await xhrPatchAsync<Record<string, never>, BackendEngagementAssignment>(
        `${BASE_URL}/${engagementId}/assignments/${assignmentId}/accept-offer`,
        {},
    )
}

export const rejectAssignmentOffer = async (
    engagementId: string,
    assignmentId: string,
): Promise<void> => {
    await xhrPatchAsync<Record<string, never>, BackendEngagementAssignment>(
        `${BASE_URL}/${engagementId}/assignments/${assignmentId}/reject-offer`,
        {},
    )
}

export const getEngagementByNanoId = async (nanoId: string): Promise<Engagement> => {
    const response = await xhrGetAsync<BackendEngagement>(`${BASE_URL}/${nanoId}`)
    // eslint-disable-next-line no-console
    console.log('API Response:', response)
    const engagement = normalizeEngagement(response)
    // eslint-disable-next-line no-console
    console.log('Normalized:', engagement)
    const [hydrated] = await hydrateEngagementSkills([engagement])
    return hydrated ?? engagement
}

export const getEngagementById = async (id: string): Promise<Engagement> => {
    const response = await xhrGetAsync<BackendEngagement>(`${BASE_URL}/${id}`)
    const engagement = normalizeEngagement(response)
    const [hydrated] = await hydrateEngagementSkills([engagement])
    return hydrated ?? engagement
}

export {
    createMemberExperience,
    getMemberExperienceById,
    getMemberExperiences,
    updateMemberExperience,
} from './member-experience.service'
