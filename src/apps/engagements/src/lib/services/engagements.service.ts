import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrGetPaginatedAsync } from '~/libs/core'
import { fetchSkillsByIds } from '~/libs/shared'

import { EngagementStatus } from '../models'
import type { Engagement, EngagementListResponse } from '../models'

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
    applicationDeadline?: string
    status?: string
    createdAt?: string
    updatedAt?: string
    createdBy?: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
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

const firstDefined = <T>(...values: Array<T | undefined>): T | undefined => (
    values.reduce<T | undefined>((acc, value) => acc ?? value ?? undefined, undefined)
)

const withDefault = <T>(fallback: T, ...values: Array<T | undefined>): T => (
    firstDefined(...values) ?? fallback
)

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
    applicationDeadline: withDefault('', data.applicationDeadline),
    countries: withDefault([], data.countries),
    createdAt: withDefault('', data.createdAt),
    createdBy: withDefault('', data.createdBy),
    description: withDefault('', data.description),
    duration: normalizeDuration(data),
    id: withDefault('', data.id, data.nanoId),
    nanoId: withDefault('', data.nanoId, data.id),
    projectId: withDefault('', data.projectId),
    requiredSkills: withDefault([], data.requiredSkills),
    status: normalizeEngagementStatus(data.status),
    timeZones: withDefault([], data.timeZones),
    title: withDefault('', data.title),
    updatedAt: withDefault('', data.updatedAt),
})

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

export const getEngagementByNanoId = async (nanoId: string): Promise<Engagement> => {
    const response = await xhrGetAsync<BackendEngagement>(`${BASE_URL}/${nanoId}`)
    const engagement = normalizeEngagement(response)
    const [hydrated] = await hydrateEngagementSkills([engagement])
    return hydrated ?? engagement
}

export const getEngagementById = async (id: string): Promise<Engagement> => {
    const response = await xhrGetAsync<BackendEngagement>(`${BASE_URL}/${id}`)
    const engagement = normalizeEngagement(response)
    const [hydrated] = await hydrateEngagementSkills([engagement])
    return hydrated ?? engagement
}
