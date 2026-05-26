import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPatchAsync } from '~/libs/core'

export interface LlmProvider {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
}

export interface Llm {
  id: string;
  providerId: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  createdAt: string;
  createdBy: string;
  provider: LlmProvider;
}

export interface Scorecard {
  id: string;
  legacyId: string;
  status: string;
  type: string;
  challengeTrack: string;
  challengeType: string;
  name: string;
  version: string;
  minScore: number;
  minimumPassingScore: number;
  maxScore: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AiWorkflow {
  id: string;
  name: string;
  llmId: string;
  description: string;
  defUrl: string;
  gitWorkflowId: string;
  gitOwnerRepo: string;
  scorecardId: string;
  disabled: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  llm: Llm;
  scorecard: Scorecard;
}

export async function getAiWorkflows(): Promise<AiWorkflow[]> {
    const response = await xhrGetAsync<AiWorkflow[]>(`${EnvironmentConfig.API.V6}/workflows`)
    return response
}

export async function updateAiWorkflow(
    id: string,
    data: Partial<Pick<AiWorkflow, 'disabled'>>,
): Promise<AiWorkflow> {
    const response = await xhrPatchAsync<Partial<Pick<AiWorkflow, 'disabled'>>, AiWorkflow>(
        `${EnvironmentConfig.API.V6}/workflows/${id}`,
        data,
    )
    return response
}
