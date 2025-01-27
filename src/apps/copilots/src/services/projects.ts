import useSWR, { SWRResponse } from 'swr'

import { xhrGetAsync } from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import { Project } from '../models/Project'

const baseUrl = `${EnvironmentConfig.API.V5}/projects`

export const useFetchProjects = (): SWRResponse<Project[]> => {
    const response = useSWR(baseUrl, xhrGetAsync<Project[]>, {
        refreshInterval: 0,
        revalidateOnFocus: false,
    })
    return response
}
