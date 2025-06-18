import { chunk } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { xhrGetAsync } from '~/libs/core'
import { buildUrl } from '~/libs/shared/lib/utils/url'
import { EnvironmentConfig } from '~/config'

import { Project } from '../models/Project'

const baseUrl = `${EnvironmentConfig.API.V5}/projects`

export type ProjectsResponse = SWRResponse<Project[], Project[]>

/**
 * Custom hook to fetch and manage projects data.
 *
 * @param {string} [search] - Optional search query to filter projects by name.
 * @param {Object} [config] - Optional configuration object.
 * @param {() => boolean} [config.isPaused] - Optional function to determine if the request should be paused.
 * @param {any} config.filter - Filter object to be applied to the request.
 * @returns {ProjectsResponse} - The response containing the projects data.
 */
export const useProjects = (search?: string, config?: {isPaused?: () => boolean, filter: any}): ProjectsResponse => {
    const params = { name: search, ...config?.filter }
    const url = buildUrl(baseUrl, params)

    const fetcher = (): Promise<Project[]> => {
        if (config?.filter?.id && Array.isArray(config.filter.id)) {
            const chunks = chunk(config.filter.id, 20)
            return Promise.all(
                chunks.map(page => xhrGetAsync<Project[]>(buildUrl(baseUrl, { ...params, id: page }))),
            )
                .then(responses => responses.flat())
        }

        return xhrGetAsync<Project[]>(url)
    }

    return useSWR(url, fetcher, {
        isPaused: config?.isPaused ?? (() => false),
        refreshInterval: 0,
        revalidateOnFocus: false,
    })
}

export const getProjects = (search?: string, filter?: any): Promise<Project[]> => {
    const params = { name: `"${search}"`, ...filter }
    const url = buildUrl(baseUrl, params)
    return xhrGetAsync<Project[]>(url)
}
