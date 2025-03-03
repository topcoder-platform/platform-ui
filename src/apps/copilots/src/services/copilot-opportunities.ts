import useSWR, { SWRResponse } from 'swr'
import useSWRInfinite, { SWRInfiniteResponse } from 'swr/infinite'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'
import { buildUrl } from '~/libs/shared/lib/utils/url'

import { CopilotOpportunity } from '../models/CopilotOpportunity'

const baseUrl = `${EnvironmentConfig.API.V5}/projects`

const PAGE_SIZE = 10

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
        return `${baseUrl}/copilots/opportunities?page=${pageIndex + 1}&pageSize=${PAGE_SIZE}&sort=createdAt desc`
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

    return { data: opportunities, isValidating, setSize: (s: number) => { setSize(s) }, size }
}

export type CopilotOpportunityResponse = SWRResponse<CopilotOpportunity, CopilotOpportunity>

/**
 * Custom hook to fetch copilot opportunity by id.
 *
 * @param {string} opportunityId - The unique identifier of the copilot request.
 * @returns {CopilotOpportunityResponse} - The response containing the copilot request data.
 */
export const useCopilotOpportunity = (opportunityId?: string): CopilotOpportunityResponse => {
    const url = opportunityId ? buildUrl(`${baseUrl}/copilots/opportunities/${opportunityId}`) : undefined

    const fetcher = (urlp: string): Promise<CopilotOpportunity> => xhrGetAsync<CopilotOpportunity>(urlp)
        .then(copilotOpportunityFactory)

    return useSWR(url, fetcher, {
        refreshInterval: 0,
        revalidateOnFocus: false,
    })
}
