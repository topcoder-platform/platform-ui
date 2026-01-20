import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrGetPaginatedAsync, xhrPostAsync } from '~/libs/core'

import type {
    Application,
    ApplicationListResponse,
    CreateApplicationRequest,
} from '../models'

const API_BASE_URL = `${EnvironmentConfig.API.V6}/engagements`
const APPLICATIONS_URL = `${API_BASE_URL}/applications`
const ENGAGEMENTS_URL = `${API_BASE_URL}/engagements`

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

export interface GetApplicationsParams {
    page?: number
    perPage?: number
    status?: string | string[]
    userId?: number | string
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

export const createApplication = async (
    engagementId: string,
    data: CreateApplicationRequest,
): Promise<Application> => xhrPostAsync<CreateApplicationRequest, Application>(
    `${ENGAGEMENTS_URL}/${engagementId}/applications`,
    data,
)

export const getMyApplications = async (
    params: GetApplicationsParams = {},
): Promise<ApplicationListResponse> => {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.perPage) queryParams.append('perPage', params.perPage.toString())
    if (params.userId !== undefined) queryParams.append('userId', `${params.userId}`)
    if (params.status) {
        const statusParts = Array.isArray(params.status)
            ? params.status
            : params.status.split(',')
        const statusValue = statusParts
            .map(status => status.trim())
            .filter(Boolean)
            .map(status => status.toUpperCase())
            .join(',')
        if (statusValue) {
            queryParams.append('status', statusValue)
        }
    }

    const url = `${APPLICATIONS_URL}?${queryParams.toString()}`
    const response = await xhrGetPaginatedAsync<Application[] | BackendPaginatedResponse<Application>>(url)
    return normalizePaginatedResponse(response, params.page, params.perPage)
}

export const getApplicationById = async (id: string): Promise<Application> => (
    xhrGetAsync<Application>(`${APPLICATIONS_URL}/${id}`)
)

export const checkExistingApplication = async (
    engagementId: string,
    userId?: number | string,
): Promise<{ hasApplied: boolean; application?: Application }> => {
    const queryParams = new URLSearchParams()
    queryParams.append('engagementId', engagementId)
    queryParams.append('page', '1')
    queryParams.append('perPage', '1')
    if (userId !== undefined) {
        queryParams.append('userId', `${userId}`)
    }

    const response = await xhrGetAsync<{ data?: Application[] } | Application[]>(
        `${APPLICATIONS_URL}?${queryParams.toString()}`,
    )

    const applications = Array.isArray(response) ? response : response.data ?? []
    const application = applications[0]

    return {
        application,
        hasApplied: Boolean(application),
    }
}
