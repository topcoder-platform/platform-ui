import useSWRInfinite, { SWRInfiniteResponse } from 'swr/infinite'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { CopilotOpportunity } from '../models/CopilotOpportunity'

const baseUrl = `${EnvironmentConfig.API.V5}/projects`

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
