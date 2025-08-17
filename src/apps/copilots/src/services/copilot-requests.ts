import useSWR, { SWRResponse } from 'swr'
import useSWRInfinite, { SWRInfiniteResponse } from 'swr/infinite'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPatchAsync, xhrPostAsync } from '~/libs/core'
import { buildUrl } from '~/libs/shared/lib/utils/url'

import { CopilotRequest } from '../models/CopilotRequest'

const baseUrl = `${EnvironmentConfig.API.V5}/projects`
const PAGE_SIZE = 20

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
        startDate: new Date(data.data?.startDate),
    }
}

export type CopilotRequestsResponse = {
    data: CopilotRequest[];
    hasMoreCopilotRequests: boolean;
    isValidating: boolean;
    size: number;
    setSize: (size: number) => void;
}

/**
 * Custom hook to fetch copilot requests for a given project.
 *
 * @param {string} [projectId] - Optional project ID to fetch copilot requests for a specific project.
 * @returns {CopilotRequestsResponse} - The response containing copilot requests.
 */
export const useCopilotRequests = (projectId?: string): CopilotRequestsResponse => {
    const getKey = (pageIndex: number, previousPageData: CopilotRequest[]): string | undefined => {
        if (previousPageData && previousPageData.length < PAGE_SIZE) return undefined
        const url = buildUrl(`${baseUrl}${projectId ? `/${projectId}` : ''}/copilots/requests`)
        return `
            ${url}?page=${pageIndex + 1}&pageSize=${PAGE_SIZE}&sort=createdAt desc
        `
    }

    const fetcher = (url: string): Promise<CopilotRequest[]> => xhrGetAsync<CopilotRequest[]>(url)
        .then((data: any) => data.map(copilotRequestFactory))

    const {
        isValidating,
        data = [],
        size,
        setSize,
    }: SWRInfiniteResponse<CopilotRequest[]> = useSWRInfinite(getKey, fetcher, {
        revalidateOnFocus: false,
    })

    // Flatten data array
    const copilotRequests = data ? data.flat() : []

    const lastPage = data[data.length - 1] || []
    const hasMoreCopilotRequests = lastPage.length === PAGE_SIZE

    return { data: copilotRequests, hasMoreCopilotRequests, isValidating, setSize: (s: number) => { setSize(s) }, size }
}

export type CopilotRequestResponse = SWRResponse<CopilotRequest, CopilotRequest>

/**
 * Custom hook to fetch and manage the state of a copilot request.
 *
 * @param {string} requestId - The unique identifier of the copilot request.
 * @returns {CopilotRequestResponse} - The response containing the copilot request data.
 */
export const useCopilotRequest = (requestId?: string): CopilotRequestResponse => {
    const url = requestId && buildUrl(`${baseUrl}/copilots/requests/${requestId}`)

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
    const url = request.id
        ? `${baseUrl}/copilots/requests/${request.id}` : `${baseUrl}/${request.projectId}/copilots/requests`

    const requestData = {
        data: { ...request, id: undefined },
    }

    return request.id ? xhrPatchAsync(url, requestData) : xhrPostAsync(url, requestData, {})
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
