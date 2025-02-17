import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync } from '~/libs/core'
import { buildUrl } from '~/libs/shared/lib/utils/url'

import { CopilotRequest } from '../models/CopilotRequest'

const baseUrl = `${EnvironmentConfig.API.V5}/projects`

/**
 * Creates a CopilotRequest object by merging the provided data and its nested data,
 * setting specific properties, and formatting the createdAt date.
 *
 * @param data - The input data object containing the properties to be merged and transformed.
 * @returns A new CopilotRequest object with the transformed properties.
 */
function copilotRequestFactory(data: any): CopilotRequest {
    return {
        ...data,
        ...data.data,
        copilotOpportunity: undefined,
        createdAt: new Date(data.createdAt),
        data: undefined,
        opportunity: data.copilotOpportunity?.[0],
    }
}

export type CopilotRequestsResponse = SWRResponse<CopilotRequest[], CopilotRequest[]>

/**
 * Custom hook to fetch copilot requests for a given project.
 *
 * @param {string} [projectId] - Optional project ID to fetch copilot requests for a specific project.
 * @returns {CopilotRequestsResponse} - The response containing copilot requests.
 */
export const useCopilotRequests = (projectId?: string): CopilotRequestsResponse => {
    const url = buildUrl(`${baseUrl}${projectId ? `/${projectId}` : ''}/copilots/requests`)

    const fetcher = (urlp: string): Promise<CopilotRequest[]> => xhrGetAsync<CopilotRequest[]>(urlp)
        .then((data: any) => data.map(copilotRequestFactory))

    return useSWR(url, fetcher, {
        refreshInterval: 0,
        revalidateOnFocus: false,
    })
}

export type CopilotRequestResponse = SWRResponse<CopilotRequest, CopilotRequest>

/**
 * Custom hook to fetch and manage the state of a copilot request.
 *
 * @param {string} requestId - The unique identifier of the copilot request.
 * @returns {CopilotRequestResponse} - The response containing the copilot request data.
 */
export const useCopilotRequest = (requestId: string): CopilotRequestResponse => {
    const url = buildUrl(`${baseUrl}/copilots/requests/${requestId}`)

    const fetcher = (urlp: string): Promise<CopilotRequest> => xhrGetAsync<CopilotRequest>(urlp)
        .then(copilotRequestFactory)

    return useSWR(url, fetcher, {
        refreshInterval: 0,
        revalidateOnFocus: false,
    })
}

/**
 * Saves a copilot request by sending a POST request to the server.
 *
 * @param {CopilotRequest} request - The copilot request to be saved.
 * @returns {Promise<CopilotRequest>} A promise that resolves to the saved copilot request.
 */
export const saveCopilotRequest = (request: CopilotRequest)
: Promise<CopilotRequest> => {
    const url = `${baseUrl}/${request.projectId}/copilots/requests`
    const requestData = {
        data: request,
    }

    return xhrPostAsync(url, requestData, {})
}

/**
 * Approves a copilot request by sending a POST request to the server.
 *
 * @param {CopilotRequest} request - The copilot request to be approved.
 * @returns {Promise<CopilotRequest>} A promise that resolves to the approved copilot request.
 */
export const approveCopilotRequest = (request: CopilotRequest)
: Promise<CopilotRequest> => {
    const url = `${baseUrl}/${request.projectId}/copilots/requests/${request.id}/approve`
    const requestData = {
        type: request.projectType,
    }

    return xhrPostAsync(url, requestData, {})
}
