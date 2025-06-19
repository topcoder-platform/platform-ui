import useSWR, { SWRResponse } from 'swr'
import useSWRInfinite, { SWRInfiniteResponse } from 'swr/infinite'

import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync, xhrPostAsync } from '~/libs/core'
import { buildUrl } from '~/libs/shared/lib/utils/url'

import { CopilotOpportunity } from '../models/CopilotOpportunity'
import { CopilotApplication } from '../models/CopilotApplication'

export const copilotBaseUrl = `${EnvironmentConfig.API.V5}/projects`

const PAGE_SIZE = 20

/**
 * Creates a CopilotOpportunity object by merging the provided data and its nested data,
 * setting specific properties, and formatting the createdAt date.
 *
 * @param data - The input data object containing the properties to be merged and transformed.
 * @returns A new CopilotOpportunity object with the transformed properties.
 */
function copilotOpportunityFactory(data: any): CopilotOpportunity {
    return {
        ...data,
        ...data.data,
        projectName: data.project.name,
    }
}

export interface CopilotOpportunitiesResponse {
    isValidating: boolean;
    data: CopilotOpportunity[];
    hasMoreOpportunities: boolean;
    size: number;
    setSize: (size: number) => void;
}

/**
 * Custom hook to fetch all copilot requests.
 *
 * @returns {CopilotOpportunitiesResponse} - The response containing copilot opportunities.
 */
export const useCopilotOpportunities = (): CopilotOpportunitiesResponse => {
    const getKey = (pageIndex: number, previousPageData: CopilotOpportunity[]): string | undefined => {
        if (previousPageData && previousPageData.length < PAGE_SIZE) return undefined
        return `
            ${copilotBaseUrl}/copilots/opportunities?page=${pageIndex + 1}&pageSize=${PAGE_SIZE}&sort=createdAt desc
        `
    }

    const fetcher = (url: string): Promise<CopilotOpportunity[]> => xhrGetAsync<CopilotOpportunity[]>(url)
        .then((data: any) => data.map(copilotOpportunityFactory))

    const {
        isValidating,
        data = [],
        size,
        setSize,
    }: SWRInfiniteResponse<CopilotOpportunity[]> = useSWRInfinite(getKey, fetcher, {
        revalidateOnFocus: false,
    })

    // Flatten data array
    const opportunities = data ? data.flat() : []

    const lastPage = data[data.length - 1] || []
    const hasMoreOpportunities = lastPage.length === PAGE_SIZE

    return { data: opportunities, hasMoreOpportunities, isValidating, setSize: (s: number) => { setSize(s) }, size }
}

export type CopilotOpportunityResponse = SWRResponse<CopilotOpportunity, CopilotOpportunity>

export type CopilotApplicationResponse = SWRResponse<CopilotApplication[], CopilotApplication[]>

/**
 * Custom hook to fetch copilot opportunity by id.
 *
 * @param {string} opportunityId - The unique identifier of the copilot request.
 * @returns {CopilotOpportunityResponse} - The response containing the copilot request data.
 */
export const useCopilotOpportunity = (opportunityId?: string): CopilotOpportunityResponse => {
    const url = opportunityId ? buildUrl(`${copilotBaseUrl}/copilot/opportunity/${opportunityId}`) : undefined

    const fetcher = (urlp: string): Promise<CopilotOpportunity> => xhrGetAsync<CopilotOpportunity>(urlp)
        .then(copilotOpportunityFactory)

    return useSWR(url, fetcher, {
        refreshInterval: 0,
        revalidateOnFocus: false,
    })
}

/**
 * apply copilot opportunity
 * @param opportunityId
 * @param request
 * @returns
 */
export const applyCopilotOpportunity = async (opportunityId: number, request?: {
    notes?: string;
}): Promise<CopilotApplication> => {
    const url = `${copilotBaseUrl}/copilots/opportunity/${opportunityId}/apply`

    return xhrPostAsync(url, request, {})
}

/**
 * apply copilot opportunity
 * @param opportunityId
 * @param applicationId
 * @returns
 */
export const assignCopilotOpportunity = async (
    opportunityId: string,
    applicationId: number,
): Promise<{applicationId: number}> => {
    const url = `${copilotBaseUrl}/copilots/opportunity/${opportunityId}/assign`

    return xhrPostAsync(url, { applicationId: applicationId.toString() }, {})
}

/**
 * cancel copilot opportunity
 * @param opportunityId
 * @returns
 */
export const cancelCopilotOpportunity = async (
    opportunityId: string,
): Promise<{applicationId: number}> => {
    const url = `${copilotBaseUrl}/copilots/opportunity/${opportunityId}/cancel`

    return xhrDeleteAsync(url)
}

/**
 * Custom hook to fetch copilot applications by opportunity id.
 *
 * @param {string} opportunityId - The unique identifier of the copilot request.
 * @returns {CopilotApplicationResponse} - The response containing the copilot application data.
 */
export const useCopilotApplications = (opportunityId?: string): CopilotApplicationResponse => {
    const url = opportunityId
        ? buildUrl(`${copilotBaseUrl}/copilots/opportunity/${opportunityId}/applications`)
        : undefined

    const fetcher = (urlp: string): Promise<CopilotApplication[]> => xhrGetAsync<CopilotApplication[]>(urlp)
        .then(data => data)
        .catch(() => [])

    return useSWR(url, fetcher)
}
