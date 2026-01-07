import { EnvironmentConfig } from '~/config'
import { getAsync, postAsync, getPaginatedAsync } from '~/libs/core'
import {
    Application,
    ApplicationListResponse,
    CreateApplicationRequest,
} from '../models'

const BASE_URL = `${EnvironmentConfig.API.V6}/engagements`

export interface GetApplicationsParams {
    page?: number
    perPage?: number
    status?: string | string[]
    userId?: number
}

export const createApplication = async (
    engagementId: string,
    data: CreateApplicationRequest,
): Promise<Application> => {
    return postAsync<CreateApplicationRequest, Application>(
        `${BASE_URL}/${engagementId}/applications`,
        data,
    )
}

export const getMyApplications = async (
    params: GetApplicationsParams = {},
): Promise<ApplicationListResponse> => {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.perPage) queryParams.append('perPage', params.perPage.toString())
    if (params.status) {
        const statusValue = Array.isArray(params.status)
            ? params.status.join(',')
            : params.status
        if (statusValue) {
            queryParams.append('status', statusValue)
        }
    }

    const url = `${EnvironmentConfig.API.V6}/applications?${queryParams.toString()}`
    return getPaginatedAsync<Application[]>(url)
}

export const getApplicationById = async (id: string): Promise<Application> => {
    return getAsync<Application>(`${EnvironmentConfig.API.V6}/applications/${id}`)
}

export const checkExistingApplication = async (
    engagementId: string,
): Promise<{ hasApplied: boolean; application?: Application }> => {
    return getAsync<{ hasApplied: boolean; application?: Application }>(
        `${BASE_URL}/${engagementId}/applications/check`,
    )
}
