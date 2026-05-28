import { EnvironmentConfig } from '~/config'
import { xhrDeleteAsync, xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

import { AiWorkflow } from './ai-workflows.service'

export interface TemplateWorkflowItem {
    id: string
    workflowId: string
    weightPercent: number
    isGating: boolean
    workflow: AiWorkflow
}

export interface AiReviewTemplate {
    id: string
    title: string
    description: string
    challengeTrack: string
    challengeType: string
    version: number
    minPassingThreshold: number
    mode: string
    autoFinalize: boolean
    disabled: boolean
    createdAt: string
    updatedAt: string
    workflows: TemplateWorkflowItem[]
}

export interface AiReviewTemplatesFilter {
    challengeTrack?: string
    challengeType?: string
}

export async function getAiReviewTemplates(
    filter?: AiReviewTemplatesFilter,
): Promise<AiReviewTemplate[]> {
    const params = new URLSearchParams()

    if (filter?.challengeTrack) {
        params.append('challengeTrack', filter.challengeTrack)
    }

    if (filter?.challengeType) {
        params.append('challengeType', filter.challengeType)
    }

    const query: string = params.toString()
    const url: string = `${EnvironmentConfig.API.V6}/ai-review/templates${query ? `?${query}` : ''}`
    const response = await xhrGetAsync<AiReviewTemplate[]>(url)
    return response
}

export interface CreateTemplateWorkflow {
    workflowId: string
    weightPercent: number
    isGating: boolean
}

export interface CreateAiReviewTemplateRequest {
    challengeTrack: string
    challengeType: string
    title: string
    description: string
    minPassingThreshold: number
    mode: string
    autoFinalize: boolean
    formula?: Record<string, unknown>
    disabled: boolean
    workflows: CreateTemplateWorkflow[]
}

export async function createAiReviewTemplate(
    data: CreateAiReviewTemplateRequest,
): Promise<AiReviewTemplate> {
    const response = await xhrPostAsync<CreateAiReviewTemplateRequest, AiReviewTemplate>(
        `${EnvironmentConfig.API.V6}/ai-review/templates`,
        data,
    )
    return response
}

export async function deleteAiReviewTemplate(id: string): Promise<void> {
    await xhrDeleteAsync(`${EnvironmentConfig.API.V6}/ai-review/templates/${id}`)
}

export type UpdateAiReviewTemplateRequest = Partial<
    Omit<CreateAiReviewTemplateRequest, 'challengeTrack' | 'challengeType'>
>

export async function updateAiReviewTemplate(
    id: string,
    data: UpdateAiReviewTemplateRequest,
): Promise<AiReviewTemplate> {
    const response = await xhrPutAsync<UpdateAiReviewTemplateRequest, AiReviewTemplate>(
        `${EnvironmentConfig.API.V6}/ai-review/templates/${id}`,
        data,
    )
    return response
}
