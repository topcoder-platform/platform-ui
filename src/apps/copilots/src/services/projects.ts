import { chunk } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { xhrGetAsync } from '~/libs/core'
import { buildUrl } from '~/libs/shared/lib/utils/url'
import { EnvironmentConfig } from '~/config'

import { Project } from '../models/Project'

const baseUrl = `${EnvironmentConfig.API.V5}/projects`

export type ProjectsResponse = SWRResponse<Project[], Project[]>

const sleep = (ms: number): Promise<()=> void> => new Promise(resolve => { setTimeout(resolve, ms) })

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

    const fetcher = async (): Promise<Project[]> => {
        const ids = config?.filter?.id

        if (Array.isArray(ids)) {
            const idChunks = chunk(ids, 20)
            const allResults: Project[] = []

            for (const chunkIds of idChunks) {
                // eslint-disable-next-line no-await-in-loop
                const response = await xhrGetAsync<Project[]>(
                    buildUrl(baseUrl, { ...params, id: chunkIds }),
                )
                allResults.push(...response)

                // Rate limit: delay 200ms between calls
                // eslint-disable-next-line no-await-in-loop
                await sleep(200)
            }

            return allResults
        }

        return xhrGetAsync<Project[]>(url)
    }

    return useSWR(url, fetcher, {
        isPaused: config?.isPaused ?? (() => false),
        refreshInterval: 0,
        revalidateOnFocus: false,
    })
}

export const getProject = (projectId: string): Promise<Project> => {
    const url = `${baseUrl}/${projectId}`
    return xhrGetAsync<Project>(url)
}

export const getProjects = (search?: string, config?: {filter: any}): Promise<Project[]> => {
    const params = { name: search, ...config?.filter }
    const url = buildUrl(baseUrl, params)
    return xhrGetAsync<Project[]>(url)
}
