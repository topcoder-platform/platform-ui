import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrGetPaginatedAsync } from '~/libs/core'

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
    const response = await xhrGetPaginatedAsync<Engagement[] | BackendPaginatedResponse<Engagement>>(url)
    return normalizePaginatedResponse(response, params.page, params.perPage)
}

export const getEngagementByNanoId = async (nanoId: string): Promise<Engagement> => (
    xhrGetAsync<Engagement>(`${BASE_URL}/${nanoId}`)
)

export const getEngagementById = async (id: string): Promise<Engagement> => (
    xhrGetAsync<Engagement>(`${BASE_URL}/${id}`)
)
