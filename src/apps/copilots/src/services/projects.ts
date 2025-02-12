import useSWR, { SWRResponse } from 'swr'

import { xhrGetAsync, xhrPostAsync } from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import { Project } from '../models/Project'
import { CopilotRequest } from '../models/CopilotRequest'

const baseUrl = `${EnvironmentConfig.API.V5}/projects`

export const useFetchProjects = (search: string): SWRResponse<Project[], any> => {
    const url = `${baseUrl}?name=${search}`
    return useSWR(url, xhrGetAsync<Project[]>, {
        refreshInterval: 0,
        revalidateOnFocus: false,
    })
}

export const saveCopilotRequest = (request: CopilotRequest)
: Promise<CopilotRequest> => {
    const url = `${baseUrl}/${request.projectId}/copilots/request`
    const requestData = {
        data: request,
    }

    return xhrPostAsync(url, requestData)
}
