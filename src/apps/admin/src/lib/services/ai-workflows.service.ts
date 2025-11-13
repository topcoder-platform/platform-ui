import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

export interface AiWorkflow {
  id: string;
  name: string;
}

export async function getAiWorkflows(): Promise<AiWorkflow[]> {
    const response = await xhrGetAsync<AiWorkflow[]>(`${EnvironmentConfig.API.V6}/workflows`)
    return response
}
