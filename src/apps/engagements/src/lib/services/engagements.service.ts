import { EnvironmentConfig } from '~/config'
import { getAsync, getPaginatedAsync, PaginatedResponse } from '~/libs/core'
import { Engagement, EngagementListResponse } from '../models'

const BASE_URL = `${EnvironmentConfig.API.V6}/engagements`

export interface GetEngagementsParams {
    page?: number
    perPage?: number
    status?: string
    skills?: string[]
    countries?: string[]
    search?: string
}

export const getEngagements = async (
    params: GetEngagementsParams = {},
): Promise<EngagementListResponse> => {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.perPage) queryParams.append('perPage', params.perPage.toString())
    if (params.status) queryParams.append('status', params.status)
    if (params.search) queryParams.append('search', params.search)
    if (params.skills?.length) {
        params.skills.forEach(skill => queryParams.append('skills', skill))
    }
    if (params.countries?.length) {
        params.countries.forEach(country => queryParams.append('countries', country))
    }

    const url = `${BASE_URL}?${queryParams.toString()}`
    return getPaginatedAsync<Engagement[]>(url)
}

export const getEngagementByNanoId = async (nanoId: string): Promise<Engagement> => {
    return getAsync<Engagement>(`${BASE_URL}/${nanoId}`)
}

export const getEngagementById = async (id: string): Promise<Engagement> => {
    return getAsync<Engagement>(`${BASE_URL}/${id}`)
}
